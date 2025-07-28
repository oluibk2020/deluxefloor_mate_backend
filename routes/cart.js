const express = require("express");
const router = express.Router();
const {
  PrismaClient,
  PrismaClientValidationError,
  PrismaClientUnknownRequestError,
  PrismaClientKnownRequestError,
} = require("@prisma/client");
const prisma = new PrismaClient();
const authProtect = require("../middleware/auth")

//create or update a cart
router.post("/add", authProtect, async (req, res, next) => {
  //return if no token
  if (!req.user) return;

  const productId = Number(req.body.productId);
  const userId = Number(req.user.sub);
  const userEmail = req.user.email

  try {

    //check if the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json("Product not found");
    }

    //check product quantity
    if (product.quantity < 1) {
      console.log("got here");
      return res.status(404).json("Product is out of stock");
    }

    //check in cart if product exists
    const cartProduct = await prisma.cart.findFirst({
      where: { productId, userId },
    });

    //create product if not found in cart and update product qty if found
    if (!cartProduct) {
      await prisma.cart.create({
        data: {
          productId,
          userId: validUserId.id,
          quantity: 1,
        },
      });

      return res.status(200).send({
        msg: "Product successfully added to cart",
        product,
      });
    } else {
      
      //update cart if product exists in cart
      await prisma.cart.update({
        where: { id: cartProduct.id },
        data: { quantity: { increment: 1 } },
      });
      //calculation in each cart(multiply qty by price)
      let totalProductPrice = product.price * (cartProduct.quantity + 1);

      return res.status(200).json({
        product,
        quantity: cartProduct.quantity + 1,
        totalProductPrice,
      });
    }
  } catch (error) {
    next(error)
  }
});

//remove product from the cart
router.post("/remove", authProtect, async (req, res, next) => {

  //return if no token
  if (!req.user) return;

  const productId = Number(req.body.productId);
  const userId = Number(req.user.sub);

  try {
    //check valid user
    const validUserId = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!validUserId) {
      return res.status(404).json("Invalid ID supplied");
    }

    //check if the product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json("Product not found");
    }

    //check in cart if product exists
    const cartProduct = await prisma.cart.findFirst({
      where: { productId },
    });

    // Decrease the quantity or remove the item from the cart
    if (!cartProduct) {
      return res.send("This product is not in cart");
    }
    if (cartProduct.quantity > 1) {
      await prisma.cart.update({
        where: { id: cartProduct.id },
        data: { quantity: { decrement: 1 } },
      });

      //calculation in each cart(multiply qty by price)
      let totalProductPrice = product.price * (cartProduct.quantity - 1);

      return res.status(200).send({
        msg: `Success. Quantity of ${product.title} has been reduced by 1`,
        product,
        quantity: cartProduct.quantity - 1,
        totalProductPrice,
      });
    } else {
      await prisma.cart.delete({ where: { id: cartProduct.id } });

      return res.json("Product removed from cart successfully");
    }
  } catch (error) {
    next(error)
  }
});

//get cart of a specific user
router.get("/", authProtect, async (req, res, next) => {

  //return if no token
  if (!req.user) return;

  const userId = Number(req.user.sub);
  try {
    //check valid user
    const validUserId = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!validUserId) {
      return res.status(404).json("Invalid ID supplied");
    }

    //get all carts
    const cartItems = await prisma.cart.findMany({ where: { userId } });

    //calculation in each cart(multiply qty by price)
    let totalPrice = 0;
    let VAT = 200;
    for (const cartItem of cartItems) {
      // Fetch the product price
      const product = await prisma.product.findUnique({
        where: { id: cartItem.productId },
      });

      if (product) {
        totalPrice += product.price * cartItem.quantity;
      }
    }

    if (totalPrice !== 0) {
      totalPrice += VAT;
    }

    res.json({
      msg: "successfull",
      totalPrice: `Total Cart Price: Product price + VAT ($200) = $${totalPrice.toFixed(
        2
      )}`,
      cartItems,
    });
  } catch (error) {
    next(error)
  }
});

module.exports = router;
