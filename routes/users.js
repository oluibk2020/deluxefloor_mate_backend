const express = require("express");

const router = express.Router();

const { PrismaClient, PrismaClientValidationError } = require("@prisma/client");
const prisma = new PrismaClient();
const argon = require("argon2");
const userSchema = require("../joischema/userSchema");
const userPwdSchema = require("../joischema/userSchema");
const authProtect = require("../middleware/auth");
const adminProtect = require("../middleware/authAdmin");

//update a user a manager
router.put("/role/manager", [authProtect, adminProtect], async (req, res, next) => {
  try {
    //validate user email inputs
    const valResult = userSchema.roleVal.validate(req.body, {
      abortEarly: false,
    });

    if (valResult.error) {
      return res.status(400).json({ msg: valResult.error.details });
    }

    const { email, managerRoleStatus } = req.body;

    //check if user is on database
    //checking user on db
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    //send err if email already exists
    if (!user) {
      return res.status(400).send({ msg: "user is not registered on system" });
    }

    //update user to manager
    const auser = await prisma.user.update({
      where: {
        email,
      },
      data: {
        isManager: managerRoleStatus,
      },
    });

    return res.status(200).json({
      msg: "user updated successfully to manager",
    });
  } catch (error) {
    next(error);
  }
});

//register a user
router.post("/", async (req, res, next) => {
  //user validation of inputs using Joi
  const valResult = userSchema.userVal.validate(req.body, {
    abortEarly: false,
  });

  if (valResult.error) {
    return res.status(400).json(valResult.error.details);
  } else {
    //validate user password inputs
    const pwdResult = userPwdSchema.pwdVal.validate(req.body.password);
    if (pwdResult.error) {
      return res.status(400).json(pwdResult.error.details);
    }

    //if passed
    const { email, password, mobile, firstName, lastName } = req.body;

    //sign-up checks

    //check if user is on database
    try {
      //checking user on db
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });
      //send err if email already exists
      if (user) {
        return res.status(400).send({ msg: "email is already registered" });
      }

      //hash password
      const pwdHash = await argon.hash(password);

      //create a user
      const auser = await prisma.user.create({
        data: {
          password: pwdHash,
          email,
          mobile,
          firstName,
          lastName,
        },
      });

      return res.status(200).json({
        msg: "user created successfully",
      });
    } catch (error) {
      next(error);
    }
  }
});



module.exports = router;
