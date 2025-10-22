const express = require("express");
const router = express.Router();

const crypto = require("crypto");
const argon2 = require("argon2"); //hashing password
const sendMail = require("./mail");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const resetPasswordSchema = require("../joischema/userSchema");
const emailSchema = require("../joischema/userSchema");
const userPwdSchema = require("../joischema/userSchema");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 100, //15 mins
  max: 7, //limit each ip to 3 requests
  message:
    "Too many requests from your IP to reset your Password, please try again later",
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

//reset password request
router.put("/password-request", limiter, async (req, res, next) => {
  // Create random number without leading zeros
  // Create random number without leading zeros
  try {
  const sixDigit = crypto.randomBytes(2).readUInt16BE(0) % 90000 + 100000;
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes from now
  
  // user validation of inputs using Joi

  const valResult = emailSchema.emailVal.validate(req.body, {
    abortEarly: false,
  });
  
  if (valResult.error) {
    return res.status(400).json({ msg: valResult.error.details });
  }
  
  const { email } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    //generate a unique reset token and save in database
    const resetToken = sixDigit.toString();

    await prisma.userToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: expiresAt,
      },
    });

    //send email with the token
    await sendMail.mailHandler(
      `Hello ${user.firstName + " " + user.lastName}`,
      `Kindly find your token to reset your account.
      
      Token: ${resetToken}
      
      If you didn't make this request, please contact Admin immediately`,
      `${user.email}`,
      "Reset Password/OTP Request"
    );

    return res
      .status(200)
      .json({ msg: "Reset Password Requested Successfully" });
  } catch (error) {
    next(error);
  }
});

//route to reset password using the token
router.post("/password", limiter, async (req, res, next) => {
  try {

    //user validation of inputs using Joi
    const valResult = resetPasswordSchema.resetPasswordVal.validate(req.body, {
      abortEarly: false,
  });
  
  if (valResult.error) {
    return res.status(400).json(valResult.error.details);
  }

  const { token, newPassword, email } = req.body;

  //validate user password inputs
  const pwdResult = userPwdSchema.pwdVal.validate(newPassword);
  
  if (pwdResult.error) {
    return res.status(400).json(pwdResult.error.details);
  }

    const resetToken = await prisma.userToken.findFirst({
      where: {
        token,
      },
    });

    if (!resetToken) {
      return res.status(400).json({ msg: "Invalid or expired token" });
    }

    const expiresAt = new Date(resetToken.expiresAt).getTime();

    if (Date.now() > expiresAt) {
      //delete the used reset token
      await prisma.userToken.delete({
        where: {
          id: resetToken.id,
        },
      });
      return res.status(400).json({ msg: "invalid or expired token" });
    }

    //update user password
    const hashedPassword = await argon2.hash(newPassword);

    const getUser = await prisma.user.findUnique({
      where: {
        id: resetToken.userId,
      },
    });

    if (getUser.email !== email) {
      return res.status(404).json({ msg: "invalid user email" });
    }

    const user = await prisma.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    //delete the all tokens of user

    await prisma.userToken.deleteMany({
      where: {
        userId: resetToken.userId,
      },
    });

    //send email for success
   await sendMail.mailHandler(
      `Hello ${user.firstName + " " + user.lastName}`,
      `You have successfully reset your Account password
      
      If you didn't make this request, please contact Admin immediately`,
      `${user.email}`,
      "Reset Password Successful"
    );

    return res.status(200).json({ msg: "Password reset successful" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
