const express = require("express");

const router = express.Router();

const { PrismaClient, PrismaClientValidationError } = require("@prisma/client");
const prisma = new PrismaClient();
const argon = require("argon2");
const config = require("config");
const jwt = require("jsonwebtoken");
const userSchema = require("../joischema/userSchema");

//login a user
router.post("/", async (req, res, next) => {
  try {
    //user validation of inputs using Joi
    const valResult = userSchema.loginVal.validate(req.body, {
      abortEarly: false,
    });

    if (valResult.error) {
      return res.status(400).json({
        message: valResult.error.details,
      });
    }

    const { email, password } = req.body;
    //checking for a registered email and save it in user
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(400).json("Invalid Credentials");
    }

    //validate email with password using argon
    const validPwd = await argon.verify(user.password, password);

    if (!validPwd) {
      return res.status(400).json("Invalid Credentials");
    }

    //generate JWT Token and send back to client
    const payload = {
      sub: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      isAdmin: user.isAdmin,
      isManager: user.isManager,
    };
    const jwtOption = { expiresIn: 36000 };
    const token = jwt.sign(payload, config.get("jwtSecret"), jwtOption);
    return res.status(200).json({
      access_token: token,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
