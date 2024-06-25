const userHelper = require("../../databaseHelpers/userHelper");

const { mongoose, isObjectIdOrHexString } = require("mongoose");



module.exports = {


  userProductDetails: async (req, res) => {
    try {

      const productId = req.params.productId;
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        console.error(`Invalid ObjectId: ${productId}`);
        return res.status(400).render("errorPages/400ErrorPage", { user: req.session.isUserAuth });
      }

      const category = await userHelper.getAllListedCategory();
      const relatedProducts = await userHelper.getRelatedProducts(productId);
      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
      const wishlistItems = await userHelper.getWishlistItemsAll(req.session.isUserAuth);
      const counts = await userHelper.getTheCountOfWhislistCart(req.session.isUserAuth);
      const [singleProduct] = await userHelper.getProductDetails(productId);



      if (!singleProduct) {
        return res.status(401).redirect("/");
      }

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

  userAddToCompare: async (req, res) => {

    try {
      const category = await userHelper.getAllListedCategory();
      const counts = await userHelper.getTheCountOfCompareCart(
        req.session.isUserAuth
      );
      const CompareItems = await userHelper.getCompareItemsAll(
        req.session.isUserAuth
      );
      
      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );
      const product = await userHelper.getWishlistItems(req.session.isUserAuth);
      const wishlistItems = await userHelper.getWishlistItemsAll(req.session.isUserAuth);

      console.log(CompareItems,"CompareItems")
      res.status(200).render(
        "userSide/productCompare",
        {
          category,
          CompareItems,
          compareErr: req.session.compareErr,
          counts,
          user: req.session.isUserAuth,
          cartItems,
          products: product,
          wishlistItems
        },
        (err, html) => {
          if (err) {
            console.log(err);

            return res.send(err);
          }

          delete req.session.compareErr;

          res.send(html);
        }
      );
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
}

