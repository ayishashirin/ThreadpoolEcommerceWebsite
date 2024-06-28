const userHelper = require("../../databaseHelpers/userHelper");

const Productdb=require('../../model/adminSide/productModel')


module.exports = {


  showProductsCategory: async (req, res) => {
    try {
      const currentPage = parseInt(req.query.page) || 1; // ParseInt to ensure currentPage is a number
      const countsC = await userHelper.getTheCountOfCompareCart(
        req.session.isUserAuth
      );
      const CompareItems = await userHelper.getCompareItemsAll(
        req.session.isUserAuth
      );
      const category = await userHelper.getAllListedCategory();
      const counts = await userHelper.getTheCountOfWhislistCart(req.session.isUserAuth);
      
      let product;
      if (!req.query.sort) {
        product = await userHelper.userSingleProductCategory(req.query);
      }
  
      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
      const wishlistItems = await userHelper.getWishlistItemsAll(req.session.isUserAuth);
      const totalProducts = await userHelper.userTotalProductNumber(req.params.category);
      const isCartItem = await userHelper.isProductCartItem(req.params.id, req.session.isUserAuth);
      const iswishlistItem = await userHelper.isProductWishlistItem(req.params.id, req.session.isUserAuth);
      const [singleProduct] = await userHelper.getProductDetails(req.params.productId);
      const products = await userHelper.getWishlistItems(req.session.isUserAuth);
  
      if (req.query.sort) {
        product = await userHelper.userSingleProductCategory(req.query);
  
        switch (req.query.sort) {
          case "priceAsc":
            product.sort((a, b) => a.lPrice - b.lPrice);
            break;
          case "priceDesc":
            product.sort((a, b) => b.lPrice - a.lPrice);
            break;
          case "aATozZ":
            product.sort((a, b) => a.pName.localeCompare(b.pName));
            break;
          case "zZToaA":
            product.sort((a, b) => b.pName.localeCompare(a.pName));
            break;
          case "latest":
            product.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
          default:
            product.sort((a, b) => a._id - b._id);
            break;
        }
      }
  
      res.status(200).render("userSide/userSingleCategoryProducts", {
        products: product,
        category,
        currentPage,
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
        sortOrder: req.query.sortOrder,
        search: req.query.search,
        countsC,
        CompareItems
      });
    } catch (err) {
      console.log("Error:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  
  
  
      
       // --------------------------------------------------------------------------------------------------------------

 
}