
const Razorpay = require("razorpay");
const instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
});





module.exports = {
onlinePaymentSuccessfull: async (req, res) => {
    try {
      const crypto = require("crypto");

      const hmac = crypto.createHmac("sha256", process.env.key_secret);
      hmac.update(
        req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id
      );

      if (hmac.digest("hex") === req.body.razorpay_signature) {
        const newOrder = new Orderdb(req.session.newOrder);
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