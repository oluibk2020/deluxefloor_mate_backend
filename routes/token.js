const express = require("express");
const crypto = require("crypto");
const sendMail = require("./mail");
const router = express.Router();
const config = require("config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authProtect = require("../middleware/auth");
const adminProtect = require("../middleware/authAdmin");
const rateLimit = require("express-rate-limit");
const adminConfigEmail = config.get("adminEmail");

const limiter = rateLimit({
  windowMs: 5 * 60 * 100, //5 mins
  max: 7, //limit each ip to 3 requests
  message:
    "Too many requests from your IP to reset your Password, please try again later",
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

//create a token for admin
router.post(
  "/create",
  [authProtect, adminProtect],
  limiter,
  async (req, res, next) => {
    const email = req.user.email;
    

    if (email !== adminConfigEmail) {
      return res
        .status(403)
        .json({ msg: "Access Denied - You are not allowed to create a token" });
    }

    // Create random number without leading zeros
    const sixDigit = crypto.randomBytes(2).readUInt16BE(0) % 90000 + 100000;
   
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes from now

    try {
      // Check if a token already exists for the admin
      const existingToken = await prisma.userToken.findFirst({
        where: {
          userId: req.user.sub,
        },
      });

      if (existingToken) {
        // Delete the existing token
        await prisma.userToken.delete({
          where: {
            id: existingToken.id,
          },
        });
      }

      //generate a unique reset token and save in database
      const generateToken = sixDigit.toString();

      await prisma.userToken.create({
        data: {
          token: generateToken,
          userId: req.user.sub,
          expiresAt: expiresAt,
        },
      });

      //send email with the token
      await sendMail.mailHandler(
        `Hello ${req.user.firstName + " " + req.user.lastName}`,
        `Kindly find your token to confirm your request.
       <br><br>
      
      Token: ${generateToken}
      <br><br>
      
      If you didn't make this request, please contact Tech support immediately`,
        `${req.user.email}`,
        "Token Request Confirmation"
      );

      return res.status(200).json({ msg: "Token Requested Successfully" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
