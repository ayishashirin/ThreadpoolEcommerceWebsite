const userHelper = require("../../databaseHelpers/userHelper");
const adminHelper = require("../../databaseHelpers/adminHelper");
const Productdb = require("../../model/adminSide/productModel").Productdb;
const ProductVariationdb = require("../../model/adminSide/productModel").ProductVariationdb;
const Cartdb = require("../../model/userSide/cartModel");
const orderdb = require("../../model/userSide/orderModel");
const wishlistdb = require("../../model/userSide/wishlist");



module.exports = {

    
  usersAddToWishlist: async (req, res) => {
    try {
      //userHelper fn to get all listed category,counts of product in cart,all product in cart
      const category = await userHelper.getAllListedCategory();
      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );
      const WishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );

      res.render(
        "userSide/userWishList",
        {
          category,
          WishlistItems,
          counts,
          user: req.session.isUserAuth,
        },
        (err, html) => {
          if (err) {
            return res.send(err);
            console.log(err);
          }
          res.send(html);
        }
      );
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

}