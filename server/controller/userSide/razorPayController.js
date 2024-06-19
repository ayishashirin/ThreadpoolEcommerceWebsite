const Cartdb = require("../../model/userSide/cartModel");
const orderdb = require("../../model/userSide/orderModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});



module.exports = {
  onlinePaymentSuccessfull: async (req, res) => {
    try {

      const { orderId, productId } = req.query

      const hmac = crypto.createHmac("sha256", process.env.key_secret);
      hmac.update(req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id);

      if (hmac.digest("hex") === req.body.razorpay_signature) {

        if (orderId && productId) {
          await orderdb.updateOne({
            _id: orderId,
            "orderItems.productId": productId
          },
          {
            $set:{"orderItems.$.orderStatus":"Orderd"}
          }
        )
        } else {
          const newOrder = new orderdb(req.session.newOrder);
          await newOrder.save();

          const cartUpdateResult = await Cartdb.updateOne(
            { userId: req.session.isUserAuth },
            { $set: { products: [] } }
          );

          if (cartUpdateResult.nModified > 0) {
            console.log("Cart items cleared successfully.");
          } else {
            console.log("No cart items were cleared. Check if the cart was already empty.");
          }
        }


        req.session.orderSucessPage = true;
        return res.status(200).redirect("/orderSuccessfull");
      } else {
        console.log("Payment verification failed.");
        return res.status(400).send("Payment verification failed.");
      }
    } catch (error) {

      console.error("Error during online payment success handling:", error);
      return res.status(500).send("An error occurred while processing the payment.");
    }
  },


  onlinePaymentFailed: async (req, res) => {
    try {
      req.session.newOrder.orderItems.forEach(product => {
        product.orderStatus = "Pending"
      });

      const failedOrder = new orderdb({
        ...req.session.newOrder,
        paymentId: req.body.paymentId,
        orderId: req.body.orderId
      });

      await failedOrder.save();
      console.log(req.session.newOrder, "newOrder");

      const cartUpdateResult = await Cartdb.updateOne(
        { userId: req.session.isUserAuth },
        { $set: { products: [] } }
      );

      if (cartUpdateResult.nModified > 0) {
        console.log("Cart items cleared successfully.");
      } else {
        console.log("No cart items were cleared. Check if the cart was already empty.");
      }

      return res.status(200).redirect("/orderFailed");
    } catch (error) {
      console.error("Error in onlinePaymentFailed:", error);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  payAgain: async (req, res) => {
    try {
      const { orderid, productId, paymentMethode } = req.body;



      if (paymentMethode === "razorpay") {
        try {
          const failedOrder = await orderdb.findOne({
            _id: orderid,
            "orderItems.productId": productId
          }, { "orderItems.$": 1 });

          if (!failedOrder) {
            return res.status(404).json({ error: "Failed order not found" });
          } else {
            const tPrice = failedOrder.orderItems[0].totalAmount
            const options = {
              amount: tPrice * 100,
              currency: "INR",
              receipt: "" + failedOrder._id,
            };

            const order = await instance.orders.create(options);

            return res.json({
              order,
              paymentMethod: "razorpay",
              keyId: process.env.key_id,
              message: "Payment successful. Order updated.",
              failedOrder
            });
          }
        } catch (err) {
          console.error("Error processing payment retry:", err);
          // return res.status(500).render("errorPages/500ErrorPage");
        }
      } else {
        return res.status(400).json({ error: "Invalid payment method" });
      }
    } catch (err) {
      console.error("Error in payAgain:", err);
      return res.status(500).render("errorPages/500ErrorPage");
    }
  },

}