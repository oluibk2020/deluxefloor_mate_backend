const jwt = require("jsonwebtoken");
const config = require("config");

const auth = (req, res, next) => {
  //get the token from header
  const authHeader = req.headers["authorization"];

  //split the auth header and get the token
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Denied Access - Access token not found" });
  }

  //verify the token
  jwt.verify(token, config.get("jwtSecret"), (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Denied Access - Invalid token" });
    }

    req.user = user; //payload

    //pass to next middleware
    next();
  });
};

module.exports = auth;
