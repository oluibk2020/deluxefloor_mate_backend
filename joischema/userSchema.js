const Joi = require("joi");
const joiPwd = require("joi-password-complexity");

//user schema
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(3).max(100),
  lastName: Joi.string().min(3).max(100),
  mobile: Joi.string().min(3).max(20),
});


//delivery schema
const deliverySchema = Joi.object({
  address: Joi.string().min(3).max(100).required(),
  firstName: Joi.string().min(3).max(100).required(),
  lastName: Joi.string().min(3).max(100).required(),
  mobile: Joi.string().min(3).max(20).required(),
});

//reset password
const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).required(),
  token: Joi.string().required(),
  email: Joi.string().email().required()
});


//get email
const emailSchema = Joi.object({
  email: Joi.string().email().required()
});

//email schema
const otpSchema = Joi.object({
  otp: Joi.number().min(100000).max(999999).required(),
  transactionStatus: Joi.string().valid("success", "failed", "pending").required()
});

//password complexity
const complexityOptions = {
  min: 5,
  max: 30,
  lowercase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 2,
};

module.exports.userVal = userSchema;
module.exports.deliveryVal = deliverySchema
module.exports.pwdVal = joiPwd(complexityOptions);
module.exports.emailVal = emailSchema;
module.exports.resetPasswordVal = resetPasswordSchema;
module.exports.otpVal = otpSchema;