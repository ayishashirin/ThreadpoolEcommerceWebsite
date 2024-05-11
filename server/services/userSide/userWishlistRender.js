const userHelper = require("../../databaseHelpers/userHelper");
const adminHelper = require("../../databaseHelpers/adminHelper");
const Productdb = require("../../model/adminSide/productModel").Productdb;
const ProductVariationdb = require("../../model/adminSide/productModel").ProductVariationdb;
const Cartdb = require("../../model/userSide/cartModel");
const orderdb = require("../../model/userSide/orderModel");
const wishlistdb = require("../../model/userSide/wishlist");



module.exports = {

    
  userAddToWishlist: async (req, res) => {
    try {
      //userHelper fn to get all listed category,counts of product in cart,all product in cart
      const category = await userHelper.getAllListedCategory();
      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );
      const wishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );
      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );
      const product = await userHelper.getWishlistItems(req.session.isUserAuth);


      res.status(200).render(
        "userSide/userAddWishlist",
        {
          category,
          wishlistItems,
          wishlistErr: req.session.wishlistErr,
          counts,
          user: req.session.isUserAuth,
          cartItems,
          products:product
        },
        (err, html) => {
          if (err) {
            console.log(err);

            return res.send(err);
          }

          delete req.session.wishlistErr;

          res.send(html);
        }
      );
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

}