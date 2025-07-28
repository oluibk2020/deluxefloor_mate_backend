const express = require("express");
const router = express.Router();
const {
  PrismaClient,
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} = require("@prisma/client");
const prisma = new PrismaClient();
const authProtect = require("../middleware/auth");
const deliverySchema = require("../joischema/userSchema");

//create a delivery address
router.post("/add", authProtect, async (req, res, next) => {
  //user validation of inputs using Joi
  const valResult = deliverySchema.deliveryVal.validate(req.body, {
    abortEarly: false,
  });

  if (valResult.error) {
    return res.json(valResult.error.details);
  }


  const { mobile, firstName, lastName, address } = req.body;
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

    const delivery = await prisma.deliveryAddress.create({
      data: {
        mobile,
        firstName,
        lastName,
        address,
        userId,
      },
    });

    res.status(201).json(delivery);
  } catch (error) {
    next(error);
  }
});

//get all delivery addresses of a user
router.get("/", authProtect, async (req, res, next) => {
  
  //return if no token
  if (!req.user) return;

  const theId = Number(req.user.sub);

  //check for a  valid student ID

  try {
    const validUserId = await prisma.user.findUnique({
      where: {
        id: theId,
      },
    });

    if (!validUserId) {
      return res.status(404).send("Invalid ID supplied");
    }

    const delivery = await prisma.deliveryAddress.findMany({
      where: {
        userId: theId,
      },
    });

    if (!delivery) {
      return res.status(404).json({
        msg: "No delivery data found. please add some delivery details",
      });
    }

    res.json(delivery);
  } catch (error) {
    next(error)
  }
});


//get a delivery address of a user
router.get("/:id", authProtect, async (req, res, next) => {
  
  //return if no token
  if (!req.user) return;

  const deliveryId = Number(req.params.id);

  const theId = Number(req.user.sub);

  //check for a  valid student ID

  try {
    const validUserId = await prisma.user.findUnique({
      where: {
        id: theId,
      },
    });

    if (!validUserId) {
      return res.status(404).send("Invalid ID supplied");
    }

    const delivery = await prisma.deliveryAddress.findUnique({
      where: {
        id: parseInt(deliveryId),
      },
    });

    if (!delivery) {
      return res.status(404).json({
        msg: "No delivery data found. please add some delivery details",
      });
    }

   return res.json(delivery);
  } catch (error) {
    next(error)
  }
});

module.exports = router;
