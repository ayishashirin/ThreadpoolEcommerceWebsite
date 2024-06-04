const userHelper = require("../../databaseHelpers/userHelper");

const { mongoose, isObjectIdOrHexString } = require("mongoose");



module.exports = {


  userProductDetails: async (req, res) => {
      try {
          // Validate productId
          const productId = req.params.productId;
          if (!mongoose.Types.ObjectId.isValid(productId)) {
              console.error(`Invalid ObjectId: ${productId}`);
              return res.status(400).render("errorPages/400ErrorPage", { user: req.session.isUserAuth });
          }
  
          // userHelper fn to get all listed category, counts of product in cart, all products in cart, related products, productDetails
          const category = await userHelper.getAllListedCategory();
          const relatedProducts = await userHelper.getRelatedProducts(productId);
          const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
          const wishlistItems = await userHelper.getWishlistItemsAll(req.session.isUserAuth);
  
          // userHelper fn to get counts of product in cart and wishlist
          const counts = await userHelper.getTheCountOfWhislistCart(req.session.isUserAuth);
          const [singleProduct] = await userHelper.getProductDetails(productId);
  
          if (!singleProduct) {
              return res.status(401).redirect("/");
          }
  
          // userHelper function to check if the product already exists in user cart
          const isCartItem = await userHelper.isProductCartItem(productId, req.session.isUserAuth);
  
          res.status(200).render("userSide/userProductDetails", {
              products: singleProduct,
              category,
              message: req.flash("message"),
              user: req.session.isUserAuth,
              relatedProducts,
              counts,
              isCartItem,
              cartItems,
              wishlistItems
          });
      } catch (err) {
          console.log("Update query err:", err);
          res.status(500).render("errorPages/500ErrorPage", { user: req.session.isUserAuth });
      }
  },
  


}