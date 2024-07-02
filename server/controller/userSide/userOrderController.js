const userHelper = require("../../databaseHelpers/userHelper");
const path = require("path");
const Orderdb = require("../../model/userSide/orderModel");
const UserWalletdb = require("../../model/userSide/walletModel");
const ProductVariationdb =
  require("../../model/adminSide/productModel").ProductVariationdb;

module.exports = {
  userOrderReturn: async (req, res) => {
    try {
      const orderItemId = req.params.orderItemId;

      const order = await Orderdb.findOne({ "orderItems._id": orderItemId });

      if (!order) {
        return res.status(404).send("Order item not found");
      }

      const orderItem = order.orderItems.id(orderItemId);
      if (!orderItem) {
        return res.status(404).send("Order item not found");
      }

      orderItem.orderStatus = "Returned";
      await order.save();

      const userId = order.userId;
      const paymentMethod = order.paymentMethode;
      const totalPrice =
        orderItem.lPrice * orderItem.quantity - orderItem.couponDiscountAmount;

      if (paymentMethod === "wallet") {
        await UserWalletdb.updateOne(
          { userId: userId },
          {
            $inc: { walletBalance: totalPrice },
            $push: {
              transactions: {
                amount: totalPrice,
                type: "refund",
                description: `Refund for order item ${orderItemId}`,
                date: new Date(),
                status: "Order Returned",
                details: orderItemId,
              },
            },
          }
        );
      } else if (paymentMethod === "razorpay") {
        await UserWalletdb.updateOne(
          { userId: userId },
          {
            $inc: { walletBalance: totalPrice },
            $push: {
              transactions: {
                amount: totalPrice,
                type: "refund",
                description: `Refund for order item ${orderItemId}`,
                date: new Date(),
                status: "Order Returned",
                details: orderItemId,
              },
            },
          }
        );
      } else if (paymentMethod === "COD") {
        console.log("COD payment return, no wallet update needed");
      }

      await ProductVariationdb.updateOne(
        { productId: orderItem.productId },
        { $inc: { quantity: orderItem.quantity } }
      );

      return res.send("Order item returned successfully");
    } catch (error) {
      console.error("Error in return order process", error);
      res.status(500).send("Internal Server Error");
    }
  },

  userOrderCancel: async (req, res) => {
    try {
      await userHelper.userOrderCancel(
        req.params.orderId,
        req.params.productId,
        req.session.isUserAuth
      );

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("order Cancel err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
};
