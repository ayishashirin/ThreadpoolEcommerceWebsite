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
const instance = new Razorpay({
                                  key_id: process.env.key_id,
                                  key_secret: process.env.key_secret,
                              });



module.exports = {
userOrderCancel: async (req, res) => {
    try {
      //Helper fn to cancel order and update quantity back

      await userHelper.userOrderCancel(req.params.orderId, req.params.productId, req.session.isUserAuth);

      return res.status(200).redirect("/orders");
    } catch (err) {
      console.error("order Cancel err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },


  userOrderDownloadInvoice: async (req, res) => {
    
    try {
      const isOrder = await userHelper.isOrdered(
        req.params.productId,
        req.session.isUserAuth,
        req.params.orderId
      );

      if (!isOrder) {
        return res.status(401).redirect("/orders");
      }
      const user = await userHelper.userInfo(req.session.isUserAuth);

      const address = userInfo.variations[0].address.find((value) => {
        return String(value._id) === String(userInfo.variations[0].defaultAddress);
      });

      const products = [];

      isOrder.orderItems.forEach((value) => {
        const singleProduct = {
          quantity: value.quantity,
          category: value.category,
          name: value.pName,
          amount: value.fPrice,
          price: value.lPrice,
          discounts: (value.fPrice - value.lPrice) * -1,
          couponDiscountAmount: Math.round(value.couponDiscountAmount) * -1,
          offerDiscountAmount: (value.DiscountAmount) * -1,
        };

        products.push(singleProduct);
      });

      const data = {
        client: {
          name: userInfo.fullName,
          address: address.structuredAddress,
          phoneNumber: userInfo.phoneNumber,
        },
        information: {
          orderId: isOrder._id,
          date: isOrder.orderDate
            .toISOString()
            .split("T")[0]
            .split("-")
            .reverse()
            .join("-"),
          orderDate: isOrder.orderDate
            .toISOString()
            .split("T")[0]
            .split("-")
            .reverse()
            .join("-"),
        },
        products,
      };

      const customTemplate = fs.readFileSync(
        path.join(__dirname, "../../../views/userSide/invoice.ejs"),
        "utf-8"
      );
      const renderedTemplate = ejs.render(customTemplate, { data });

      const page = await browser.newPage();

      await page.setContent(renderedTemplate);

      const pdfBuffer = await page.pdf({
        format: "A4",
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");

      res.status(200).send(pdfBuffer);
    } catch (err) {
      console.error("isOrder err", err);
      res.status(500).render("errorPages/500ErrorPage");
    } finally {
      await browser.close();
    }
  },

  onlinePaymentSuccessfull: async (req, res) => {
    try {
      const crypto = require("crypto");

      const hmac = crypto.createHmac("sha256", process.env.key_secret);
      hmac.update(
        req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id
      );

      if (hmac.digest("hex") === req.body.razorpay_signature) {
        const newOrder = new orderdb(req.session.newOrder);
        await newOrder.save();
        if (req.session.isCartItem) {
          await Cartdb.updateOne(
            { userId: req.session.isUserAuth },
            { $set: { products: [] } }
          ); // empty cart items
        }
        req.session.orderSucessPage = true;
        return res.status(200).redirect("/orderSuccessfull");
      } else {
        return res.send("Order Failed");
      }
    } catch (err) {
      console.error("order razorpay err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

}