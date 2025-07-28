const express = require("express");

const router = express.Router();

const { PrismaClient, PrismaClientValidationError, PrismaClientUnknownRequestError,
  PrismaClientKnownRequestError, } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/:id", async (req, res, next) => {
     const categoryId  = Number(req.params.id);
  //get all products
  try {
    const products = await prisma.product.findMany({where:{
        categoryId
    }});

    if (!products) {
      return res.status(404).json({
        msg: "No data found. Something went wrong",
      });
    }

    res.status(200).json(products);
  } catch (error) {
   next(error)
  }
});

//to create a category
router.post("/", async (req, res, next) => {
  const { title, description} = req.body;


  try {
    const category = await prisma.category.create({
      data: {
        title: title.trim().toLowerCase(),
        description: description.trim().toLowerCase(),
      },
    });

    res.status(201).json(category);
  } catch (error) {
    next(error)
  }
});

module.exports = router
