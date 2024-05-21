const userHelper = require("../../databaseHelpers/userHelper");
const adminHelper = require("../../databaseHelpers/adminHelper");
const Productdb = require("../../model/adminSide/productModel").Productdb;
const ProductVariationdb =
  require("../../model/adminSide/productModel").ProductVariationdb;
const Cartdb = require("../../model/userSide/cartModel");
const orderdb = require("../../model/userSide/orderModel");



module.exports = {

    userProductDetails: async (req, res) => {
        try {
          //userHelper fn to get all listed category,counts of product in cart,all product in cart,related products,productDetails
          const category = await userHelper.getAllListedCategory();
          const relatedProducts = await userHelper.getRelatedProducts(
            req.params.productId
          );
          const cartItems = await userHelper.getCartItemsAll(
            req.session.isUserAuth
          );
    
          const wishlistItems = await userHelper.getWishlistItemsAll(
            req.session.isUserAuth
          );
          //userHelper fn to get all listed category
    
          const counts = await userHelper.getTheCountOfWhislistCart(
            req.session.isUserAuth
          );
          const [singleProduct] = await userHelper.getProductDetails(
            req.params.productId
          );
          if (!singleProduct) {
            return res.status(401).redirect("/");
          }
          //userHelper function to cheack if the product already exists in user cart
          const isCartItem = await userHelper.isProductCartItem(
            req.params.id,
            req.session.isUserAuth
          );
    
          res.status(200).render("userSide/userProductDetails", {
            products: singleProduct,
            category,
            message: req.flash("message"),
            user: req.session.isUserAuth,
            relatedProducts: relatedProducts,
            counts,
            isCartItem,
            cartItems,
            wishlistItems
          });
        } catch (err) {
          console.log("Update query err:", err);
          res.status(500).render("errorPages/500ErrorPage",{user: req.session.isUserAuth});
        }
      },

      // --------------------------------------------------------------------------------------------------

}