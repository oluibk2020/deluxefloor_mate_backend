const express = require("express");

const router = express.Router();

const {
  PrismaClient,
  PrismaClientValidationError,
  PrismaClientUnknownRequestError,
  PrismaClientKnownRequestError,
} = require("@prisma/client");
const prisma = new PrismaClient();
const authProtect = require("../middleware/auth");
const config = require("config");
const Flutterwave = require("flutterwave-node-v3");

const flutterwavePublicApiKey = config.get("flutterwavePublicAPIkey");
const flutterwaveApiKey = config.get("flutterwaveAPIkey");
// Flutterwave API endpoint for payments
const flutterwaveEndpoint = "https://api.flutterwave.com/v3/payments";
const flw = new Flutterwave(
  flutterwavePublicApiKey,
flutterwaveApiKey
);



// Endpoint to initiate payments
router.post("/initiate/order/:id", authProtect, async (req, res,next) => {
  //return if no token
  if (!req.user) return;

  const orderId = Number(req.params.id);

  const userId = req.user.sub;

  try {
    //check valid user
    const validUserId = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!validUserId) {
      return res.status(404).send("Invalid ID supplied");
    }

    // Fetch user's order based on id
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return res.status(404).json({
        msg: "No order found.",
      });
    }

    //flutterwave payment
    const payLoad = {
      tx_ref: orderId, //must be unique - order id
      amount: `${order.totalAmount}`,
      currency: "NGN",
      redirect_url: "https://reddystore.vercel.app/orders",
      meta: {
        consumer_id: userId,
        consumer_mac: "92a3-912ba-1192a",
      },
      customer: {
        email: req.user.email,
        phonenumber: req.user.mobile,
        name: `${req.user.firstName} ${req.user.lastName}`,
      },
      customizations: {
        title: "Reddy Store",
        logo: "https://charisintelligence.com.ng/wp-content/uploads/2022/04/cropped-chari-color-nobg1-300x136.png",
      },
    };
    const response = await fetch(flutterwaveEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${flutterwaveApiKey}`,
      },
      body: JSON.stringify(payLoad),
    });

    if (!response.ok) {
      return res.status(400).send(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Handle the payment response here
    res.send({msg: "sent to flutterwave successfully", response: data});
  } catch (error) {
    next(error)
  }
});


router.post("/callback", async (req, res, next) => {
  try {
    // Check for the signature
    const secretHash = config.get("flutterwaveSecretHash"); //from config.json
    const signature = req.headers["verif-hash"];

    if (!signature || signature !== secretHash) {
      // This request isn't from Flutterwave; discard
      res.status(401).end();
    }
console.log("signed success")
    const payload = req.body;
    //get the customer order
    const order = await prisma.order.findUnique({
      where: {
        id: Number(payload.data.tx_ref)
      },
    });

    if (!order) {
      console.log("Err: Order not found");
     return res.status(200).json({ message: "Webhook received successfully" });
    }

console.log("got order successfully")

    //verify payment on flutterwave
    
    if (
      payload.data.status === "successful" &&
      payload.data.amount >= order.totalAmount &&
      payload.data.currency === "NGN"
    ) {
      // Success! Confirm the customer's payment
      await prisma.order.update({
        where: {
          id: Number(payload.data.tx_ref),
        },
        data: {
          transactionStatus: "success",
        },
      });

	console.log("updated customer info to success")
    } else {
      // Inform the customer their payment was unsuccessful
      await prisma.order.update({
        where: {
          id: Number(payload.data.tx_ref),
        },
        data: {
          transactionStatus: "failed",
        },
      });
	console.log("updated customer info to failed")
    }

    // Send a response to Flutterwave
console.log("final msg sent to flw success")
    res.status(200).json({ message: "Webhook received successfully" });
  } catch (error) {
    next(error)
  }
});

module.exports = router;
