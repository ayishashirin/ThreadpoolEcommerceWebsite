const userHelper = require("../../databaseHelpers/userHelper");
const path = require("path");
const Orderdb = require("../../model/userSide/orderModel");
 
module.exports = {

  userOrderReturn: async (req, res) => {
    try {
        const orderItemId = req.params.orderItemId;
        // Logic to process the return
        const order = await Orderdb.findOneAndUpdate(
            { 'orderItems._id': orderItemId },
            { $set: { 'orderItems.$.orderStatus': 'Returned' } }, // Example of setting a return status
            { new: true }
        );
        if (!order) {
            return res.status(404).send('Order item not found');
        }
        res.send('Order item returned successfully');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
},
  userOrderCancel: async (req, res) => {
    try {
      //Helper fn to cancel order and update quantity back

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
