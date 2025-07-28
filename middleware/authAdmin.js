const checkAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res
      .status(403)
      .json({ message: "Access Denied. Only Admins are allowed" });
  }

  next();
};

module.exports = checkAdmin;
