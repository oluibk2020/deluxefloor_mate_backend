const express = require("express");

const router = express.Router();

const {
  PrismaClient,
} = require("@prisma/client");
const prisma = new PrismaClient();

const authProtect = require("../middleware/auth");
const adminProtect = require("../middleware/authAdmin");

//to create a product
router.post("/create", [authProtect, adminProtect], async (req, res, next) => {
  const { title, description, price, imageUrl, categoryId, quantity, cost, featured } = req.body;

  //make sure all fields are provided
  if (!title || !description || !price || !imageUrl || !categoryId || !quantity || !cost || featured===undefined) {
    return res.status(400).json({
      msg: "All fields are required",
    });
  }

  const convertedPrice = parseFloat(price);

  try {
    const aproduct = await prisma.product.create({
      data: {
        title: title.trim().toLowerCase(),
        description: description.trim().toLowerCase(),
        price: Number(convertedPrice.toFixed(2)),
        imageUrl,
        categoryId,
        quantity: Number(quantity),
        cost: Number(parseFloat(cost).toFixed(2)),
        featured: Boolean(featured)
      },
    });

    if (!aproduct) {
      return res.status(400).json({
        msg: "Product not created. Something went wrong",
      });    
    }

  return  res.status(201).json(aproduct);
  } catch (error) {
    next(error)
  }
});

//to edit a product
router.put("/update/:id",[authProtect, adminProtect], async (req, res, next) => {
  const { title, description, price,  quantity, cost } = req.body;
  const theId = Number(req.params.id);
  try {
    const aproduct = await prisma.product.update({
      data: {
        title: title.trim().toLowerCase(),
        description: description.trim().toLowerCase(),
        price: Number(parseFloat(price).toFixed(2)),
        quantity: Number(quantity),
        cost: Number(parseFloat(cost).toFixed(2))
      },
      where: {
        id: theId,
      },
    });

    if (!aproduct) {
      return res.status(400).json({
        msg: "Product not updated. Something went wrong",
      });    
    }

  return  res.status(203).json({
      msg: "Product updated successfully",
      product: aproduct
    });
  } catch (error) {
    next(error)
  }
});

//query database
router.get("/s", async (req, res, next) => {
  const {
    name,
    categoryId,
    minPrice,
    maxPrice,
    page = 1,
    limit = 4,
  } = req.query;

  // Calculate offset based on page and limit
  const offset = (page - 1) * limit;

  try {
    const products = await prisma.product.findMany({
      where: {
        title: {
          contains: name.trim().toLowerCase() || undefined,
        },
        categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
        price: {
          gte: minPrice !== undefined ? parseInt(minPrice, 10) : undefined,
          lte: maxPrice !== undefined ? parseInt(maxPrice, 10) : undefined,
        },
      },
      select:{
      id: true,
      title: true,
      price: true,
      imageUrl: true,
      description: true
     },
      take: limit, // Number of results per page
      skip: offset, // Skip the appropriate number of results
    });

    // Query total number of products without pagination
    const totalProducts = await prisma.product.count({
      where: {
        title: {
          contains: name.trim().toLowerCase() || undefined,
        },
        categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
        price: {
          gte: minPrice !== undefined ? parseInt(minPrice, 10) : undefined,
          lte: maxPrice !== undefined ? parseInt(maxPrice, 10) : undefined,
        },
      },
    });

    // Calculate total number of pages
    const totalPages = Math.ceil(totalProducts / limit);

    //send products
  return  res.status(200).json({ products, totalPages });
  } catch (error) {
    next(error)
  }
});

//get all products
router.get("/featured", async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
     select:{
      id: true,
      title: true,
      price: true,
      imageUrl: true,
      description: true,
      quantity: true,
      featured: true,
     },
     where:{
      featured: true
     }
    });

    if (!products) {
      return res.status(404).json({
        msg: "No data found. Something went wrong",
      });
    }

   return res.status(200).json(products);
  } catch (error) {
    next(error)
  }
});
//get all products
router.get("/", async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
     select:{
      id: true,
      title: true,
      price: true,
      imageUrl: true,
      description: true,
      quantity: true,
      cost: true
     }
    });

    if (!products) {
      return res.status(404).json({
        msg: "No data found. Something went wrong",
      });
    }

   return res.status(200).json(products);
  } catch (error) {
    next(error)
  }
});

//get one product
router.get("/:id", async (req, res, next) => {
    //make sure to convert params id to number before passing to prisma
    const theId = Number(req.params.id);
    try {
      const product = await prisma.product.findUnique({
        where: {
          id: theId,
        },
        select: {
          id: true,
          title: true,
          price: true,
          imageUrl: true,
          description: true,
          quantity: true,
          cost: true
        },
      });

      if (!product) {
        return res.status(404).json({
          msg: "No data found.",
        });
      }

     return res.status(200).json(product);
    } catch (error) {
     next(error)
    }
  }
);

//delete a product
router.delete("/delete/:productId", [authProtect, adminProtect], async (req, res, next) => {
  try {
    const { productId } = req.params;

    //find the book
    const product = await prisma.product.findFirst({
      where: {
        id: Number(productId)
      },
    });

    if (!product) {
      return res.status(400).json({
        msg: "product not found",
      });
    }

    //delete the book
    const deletedProduct = await prisma.product.delete({
      where: {
        id: Number(productId)
      },
    });

    if (!deletedProduct) {
      return res.status(400).json({
        message: "product not deleted",
      });
    }

    return res.status(200).json({
      message: "product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
