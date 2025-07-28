const express = require('express')

const app = express()
const port = process.env.PORT || 5000;
const config = require('config')
const cors = require("cors");
const error = require("./middleware/error")
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

//helmet middleware
app.use(helmet());


// Trust the reverse proxy
app.set("trust proxy", 1);

//limit ip requests on the server
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 mins
  max: 300, //limit each ip to 300 requests
  message:
    "Our AI has blocked you, Too many requests from your IP, please try again later",
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
app.use(limiter);

//body parser
app.use(express.json())

//form-encoded parser
app.use(express.urlencoded({extended: true}))

//cors
app.use(cors())

//import router file
const users = require("./routes/users")
const auth = require('./routes/auth')
const delivery = require('./routes/delivery')
const products = require('./routes/products')
const cart = require('./routes/cart')
const categories = require('./routes/categories')
const orders = require('./routes/order')
const payment = require('./routes/payment')
const token = require('./routes/token')
const reset = require('./routes/reset')


app.use('/users', users)
app.use('/auth', auth)
app.use('/delivery', delivery)
app.use('/products', products)
app.use('/cart', cart)
app.use('/orders', orders)
app.use('/categories', categories)
app.use('/payment', payment)
app.use('/token', token)
app.use('/reset', reset)


//error handler
app.use(error)

//env tutorial
console.log("NODE_ENV = ", process.env.NODE_ENV);
console.log("app.get() = ", app.get("env"));
console.log("App Secret = ", config.get("jwtSecret"));
console.log("Flutter secret key = ", config.get("flutterwaveAPIkey"));
console.log("flutter pub key = " , config.get("flutterwavePublicAPIkey"));
app.listen(port, () => console.log(`DeluxeStore App listening on port ${port}!`))
