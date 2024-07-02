const userHelper = require("../../databaseHelpers/userHelper");
const offerdb = require("../../model/adminSide/offerModel");
const userVariationdb = require("../../model/userSide/userVariationModel");



module.exports = {

  userOrderSuccessfull: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();
      const counts = await userHelper.getTheCountOfWhislistCart(req.session.isUserAuth);
      const wishlistItems = await userHelper.getWishlistItemsAll(req.session.isUserAuth);
      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);

      res
        .status(200)
        .render(
          "userSide/orderPlacedSuccessfull",
          {
            category, counts, user: req.session.isUserAuth, cartItems,
            wishlistItems
          },
          (err, html) => {
            if (err) {
              console.log(err);
              return res.status(500).render("errorPages/500ErrorPage");
            }

            delete req.session.orderSuccessPage;

            res.send(html);
          }
        );
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  userOrderFailed: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();
      const counts = await userHelper.getTheCountOfWhislistCart(req.session.isUserAuth);
      const wishlistItems = await userHelper.getWishlistItemsAll(req.session.isUserAuth);
      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);

      res
        .status(200)
        .render(
          "userSide/orderFailed",
          {
            category, counts, user: req.session.isUserAuth, cartItems,
            wishlistItems
          },
          (err, html) => {
            if (err) {
              console.log(err);
              return res.status(500).render("errorPages/500ErrorPage");
            }

            delete req.session.orderSuccessPage;

            res.send(html);
          }
        );
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },


  userOrders: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();
      const counts = await userHelper.getTheCountOfWhislistCart(req.session.isUserAuth);
      const wishlistItems = await userHelper.getWishlistItemsAll(req.session.isUserAuth);
      const userInfo = await userHelper.userInfo(req.session.isUserAuth);
      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
      const { orders, totalOrders } = await userHelper.userGetAllOrder(req.session.isUserAuth, req.query.page);
      orders.sort((a, b) => b.createdAt - a.createdAt);

      res.status(200).render("userSide/userOrderPage", {
        category,
        orders,
        counts,
        curentPage: Number(req.query.page) || 1,
        totalOrders,
        user: req.session.isUserAuth,
        userInfo,
        cartItems,
        wishlistItems,


      });
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },


  orderDetails: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();
      const counts = await userHelper.getTheCountOfWhislistCart(req.session.isUserAuth);
      const orderDetails = await userHelper.getSingleOrderOfDetails(req.params, req.session.isUserAuth);
      const offerDetails = await offerdb.find();
      const wishlistItems = await userHelper.getWishlistItemsAll(req.session.isUserAuth);
      const userInfo = await userHelper.userInfo(req.session.isUserAuth);
      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
      const orderAddress = await userVariationdb.find({
        userId: orderDetails.userId, address: { $elemMatch: { _id: orderDetails.address } }
      });
      if (!orderDetails) {
        return res.status(401).redirect("/orders");
      }


      res.status(200).render("userSide/userOrderSummaryPage", {
        category,
        counts,
        orderDetails,
        userInfo,
        user: req.session.isUserAuth,
        cartItems,
        wishlistItems,
        offerDetails,
        orderAddress,
      });
    } catch (err) {
      console.log("user order summary err err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },


}