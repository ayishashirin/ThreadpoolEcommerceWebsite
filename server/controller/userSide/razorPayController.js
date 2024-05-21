const Userdb = require("../../model/userSide/userModel");
const Otpdb = require("../../model/userSide/otpModel");
const Productdb = require("../../model/adminSide/productModel").Productdb;
const ProductVariationdb = require("../../model/adminSide/productModel").ProductVariationdb;
const userVariationdb = require("../../model/userSide/userVariationModel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const mongoose = require("mongoose");
const userHelper = require("../../databaseHelpers/userHelper");
const path = require("path");
const Cartdb = require("../../model/userSide/cartModel");
const usersAddToCart = require("../../services/userSide/userRender");
const saltRounds = 10; // Salt rounds for bcrypt
const orderdb = require("../../model/userSide/orderModel");
const shortid = require("shortid");
const wishlistdb = require("../../model/userSide/wishlist");
const Razorpay = require("razorpay");
const coupondb = require("../../model/adminSide/couponModel");
const crypto = require('crypto');

const instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
});

module.exports = {
  onlinePaymentSuccessfull: async (req, res) => {
    try {
      console.log("Payment Success Callback Invoked");

      const hmac = crypto.createHmac("sha256", process.env.key_secret);
      hmac.update(
        req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id
      );

      if (hmac.digest("hex") === req.body.razorpay_signature) {
        console.log("Razorpay Signature Verified");

        const newOrder = new orderdb(req.session.newOrder);

        await newOrder.save();
        console.log("Order Saved to Database:", newOrder);

        const cartUpdateResult = await Cartdb.updateOne(
          { userId: req.session.isUserAuth },
          { $set: { products: [] } }
        );

        console.log("Cart Update Result:", cartUpdateResult);

        if (cartUpdateResult.nModified > 0) {
          console.log("Cart items cleared successfully.");
        } else {
          console.log("No cart items were cleared. Check if the cart was already empty.");
        }

        req.session.orderSucessPage = true;
        return res.status(200).redirect("/orderSuccessfull");
      } else {
        console.log("Razorpay Signature Verification Failed");
        return res.send("Order Failed");
      }
    } catch (err) {
      console.error("Error in onlinePaymentSuccessfull:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
};
