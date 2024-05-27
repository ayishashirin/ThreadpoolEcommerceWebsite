const userHelper = require("../../databaseHelpers/userHelper");




module.exports = {


  showProductsCategory : async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();
      const counts = await userHelper.getTheCountOfWhislistCart(req.session.isUserAuth);
      const product = await userHelper.userSingleProductCategory(req.query);
      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
      const wishlistItems = await userHelper.getWishlistItemsAll(req.session.isUserAuth);
      const totalProducts = await userHelper.userTotalProductNumber(req.params.category);
      const isCartItem = await userHelper.isProductCartItem(req.params.id, req.session.isUserAuth);
      const iswishlistItem = await userHelper.isProductWishlistItem(req.params.id, req.session.isUserAuth);
      const [singleProduct] = await userHelper.getProductDetails(req.params.productId);
      const products = await userHelper.getWishlistItems(req.session.isUserAuth);
  
      res.status(200).render("userSide/userSingleCategoryProducts", {
        products: product,
        category,
        curentPage: Number(req.query.page),
        currentCategory: req.params.category,
        user: req.session.isUserAuth,
        counts,
        cartItems,
        isCartItem,
        totalProducts,
        singleProduct,
        product: products,
        wishlistItems,
        iswishlistItem,
        size: req.query.size,
        collection: req.query.genderCat,
        color: req.query.color,
        maxPrice: req.query.maxPrice,
        // sort: req.query.sort, 
      });
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  
      
       // --------------------------------------------------------------------------------------------------------------

 
}