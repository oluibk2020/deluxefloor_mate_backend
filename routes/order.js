const express = require("express");
const mailer = require("../utils/sendEmail");
const sendMail = require("./mail");
const router = express.Router();
const config = require("config");
const {
  PrismaClient,
  PrismaClientValidationError,
  PrismaClientUnknownRequestError,
  PrismaClientKnownRequestError,
} = require("@prisma/client");
const prisma = new PrismaClient();
const authProtect = require("../middleware/auth");
const adminProtect = require("../middleware/authAdmin");
const userSchema = require("../joischema/userSchema");

const adminConfigEmail = config.get("adminEmail");

//create an order
router.post("/", authProtect, async (req, res, next) => {
  const { deliveryAddressId, cartItems, paymentMethod } = req.body;
  const userId = req.user.sub;

  try {
    //check product quantity in cart vs the prodcut quantity in database. if any product in cart is greater than the product quantity in database, return error
    for (const cartItem of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: cartItem.id },
      });
      if (product.quantity < cartItem.quantity) {
        return res.status(400).json({
          msg: `${cartItem.quantity} pieces of Product - ${product.title} is out of stock. Please try again`,
        });
      }

    }

    // Calculate total amount of products in cart
   
    let totalAmount = 0;
    totalAmount = cartItems.reduce((total, cartItem) => {
      return total + cartItem.price * cartItem.quantity;
    }, 0);
    let VAT = (7.5 / 100) * totalAmount;
    if (totalAmount !== 0) {
      totalAmount += VAT;
    }


//create the order data
    const orderData = {
      totalAmount: Number(totalAmount.toFixed(2)),
      user: {
        connect: { id: parseInt(userId, 10) },
      },
      deliveryAddress: {
        connect: { id: parseInt(deliveryAddressId, 10) },
      },
      transactionStatus: "pending",
      paymentMethod,
      orderItems: {
        create: await Promise.all(cartItems.map(async (cartItem) => ({
          productId: cartItem.id,
          quantity: cartItem.quantity,
          price: Number(cartItem.price),
          costPrice: (await prisma.product.findUnique({
            where: { id: cartItem.id },
            select: { cost: true },
          })).cost,
        }))),
      },
    };

    const newOrder = await prisma.order.create({
      data: orderData,
      include: {
        orderItems: true,
      },
    });



    //deduct the product quantity from the database
    for (const cartItem of cartItems) {
      await prisma.product.update({
        where: {
          id: cartItem.id,
        },
        data: {
          quantity: {
            decrement: cartItem.quantity,
          },
        },
      });
    }

   

    //send email for success
    await sendMail.mailHandler(
      `${req.user.firstName} ${req.user.lastName}`,
      `Your order with ID ${newOrder.id} and total amount of ${
        newOrder.totalAmount
      } has been successfully placed. Thank you for shopping with us!`,
      `${req.user.email}`,
      "New Order Successfully Placed"
    );

    res.status(201).json(newOrder);
  } catch (error) {
    next(error);
  }
});

//get all orders
router.get("/", authProtect, async (req, res, next) => {
  const userId = req.user.sub;
  try {
    if (req.user.isAdmin || req.user.isManager) {
      // If the user is an admin, fetch all orders
      const orders = await prisma.order.findMany({
        include: {
          orderItems: true,
          deliveryAddress: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              mobile: true,
            },
          },
        },
      });
      return res.status(200).json({ firstName: req.user.firstName, orders });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        orderItems: true,
        deliveryAddress: true,
      },
    });

    res.status(200).json({ firstName: req.user.firstName, orders });
  } catch (error) {
    next(error);
  }
});

//get one order
router.get("/:id", authProtect, async (req, res, next) => {
  //return if no token
  if (!req.user) return;

  try {
    const userId = req.user.sub;
    //make sure to convert params id to number before passing to prisma
    const theId = Number(req.params.id);

    if (req.user.isAdmin || req.user.isManager) {
      const order = await prisma.order.findUnique({
        where: {
          id: theId,
        },
        include: {
          orderItems: true,
          deliveryAddress: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              mobile: true,
              isManager: true 
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({
          msg: "No data found.",
        });
      }

      const orderedProducts = [];

      for (const item of order.orderItems) {
        // Fetch the product price
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        orderedProducts.push(product);
      }

      return res.json({ order: order, products: orderedProducts });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: theId,
      },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        msg: "No data found.",
      });
    }

    const orderedProducts = [];

    for (const item of order.orderItems) {
      // Fetch the product price
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      orderedProducts.push(product);
    }

    return res.json({ order: order, products: orderedProducts });
  } catch (error) {
    next(error);
  }
});

//update an order
router.put("/update/:id", [authProtect], async (req, res, next) => {
  try {
    //user validation of inputs using Joi
    const valResult = userSchema.otpVal.validate(req.body, {
      abortEarly: false,
    });

    if (valResult.error) {
      return res.status(400).json({ msg: valResult.error.details });
    }
    const { id } = req.params;
    const { otp, transactionStatus, discountAmount, discountPaymentStatus } =
      req.body;

    //find the order
    const order = await prisma.order.findFirst({
      where: {
        id: Number(id),
      },
    });

    //if order is not found
    if (!order) {
      return res.status(404).json({
        msg: "No order data found.",
      });
    }

    //find user
    const adminUser = await prisma.user.findFirst({
      where: {
        email: adminConfigEmail,
      },
    });

    if (!adminUser) {
      return res.status(404).json({
        msg: "Admin user not found.",
      });
    }

    //fetch otp from token
    // Check if a token already exists for the admin
    const adminToken = await prisma.userToken.findFirst({
      where: {
        userId: adminUser.id,
      },
    });

    const otpToString = otp.toString()

    // reject if no token is found or is expired or does not match otp
    if (!adminToken || adminToken.token !== otpToString) {
      return res.status(400).json({ msg: "Invalid or expired token" });
    }

    const expiresAt = new Date(adminToken.expiresAt).getTime();

    //delete token if expired
    if (Date.now() > expiresAt) {
      await prisma.userToken.delete({
        where: {
          id: adminToken.id,
        },
      });
      return res.status(400).json({ msg: "invalid or expired token" });
    }

   
    //update the order
    const updatedOrder = await prisma.order.update({
      where: {
        id: Number(id),
      },
      data: {
        transactionStatus: transactionStatus,
        discountAmount: Number(discountAmount),
        discountPaymentStatus: discountPaymentStatus,
      },
    });

    //delete the token
    await prisma.userToken.delete({
      where: {
        id: adminToken.id,
      },
    });

    return res.status(200).json({
      msg: "Order updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

//delete an order
router.delete(
  "/delete/:id",
  [authProtect, adminProtect],
  async (req, res, next) => {
    try {
      const { id } = req.params;

      //find the order
      const order = await prisma.order.findFirst({
        where: {
          id: Number(id),
        },
      });

      //if order is not found
      if (!order) {
        return res.status(404).json({
          msg: "No data found.",
        });
      }

      //delete all of the order items
      const deletedOrderItems = await prisma.orderItem.deleteMany({
        where: {
          orderId: Number(id),
        },
      });

      //delete the order
      const deletedOrder = await prisma.order.delete({
        where: {
          id: Number(id),
        },
      });

      res.status(200).json("Order deleted successfully");
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
