const {
  PrismaClient,
  PrismaClientValidationError,
  PrismaClientUnknownRequestError,
  PrismaClientKnownRequestError,
} = require("@prisma/client");

const error = (err, req, res, next) => {
  console.error("Simple Error", err.message);
  console.error("Stack Trace", err.stack);

  if (err instanceof PrismaClientValidationError) {
    console.error("PRISMA ERROR");
    console.error(err.stack);
  }

  if (error instanceof PrismaClientKnownRequestError) {
     console.error(error.message);
  }
  if (error instanceof PrismaClientUnknownRequestError) {
   console.error(error.message);
  }

  return res.status(500).json({
    error: "Internal Server Error. Please check the logs for details",
  });
};

module.exports = error;
