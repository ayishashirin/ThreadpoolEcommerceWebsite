const userHelper = require("../../databaseHelpers/userHelper");

const Productdb=require('../../model/adminSide/productModel')


module.exports = {


  showProductsCategory: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();
      const counts = await userHelper.getTheCountOfWhislistCart(req.session.isUserAuth);
      if(!req.query.sort){
        var product = await userHelper.userSingleProductCategory(req.query);

      }
      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
      const wishlistItems = await userHelper.getWishlistItemsAll(req.session.isUserAuth);
      const totalProducts = await userHelper.userTotalProductNumber(req.params.category);
      const isCartItem = await userHelper.isProductCartItem(req.params.id, req.session.isUserAuth);
      const iswishlistItem = await userHelper.isProductWishlistItem(req.params.id, req.session.isUserAuth);
      const [singleProduct] = await userHelper.getProductDetails(req.params.productId);
      const products = await userHelper.getWishlistItems(req.session.isUserAuth);
      if(req.query.sort){
        if(req.query.sort=='priceAsc'){
          var product = await userHelper.userSingleProductCategory(req.query);
        // Sort products by date in ascending order
        product.sort((a, b) => a.lPrice - b.lPrice);
        }
        else if(req.query.sort=='aATozZ'){
          var product = await userHelper.userSingleProductCategory(req.query);
        
        product.sort((a, b) => a.pName.localeCompare(b.pName));

      }
      else if(req.query.sort=='zZToaA'){
        var product = await userHelper.userSingleProductCategory(req.query);
      // Sort products by date in ascending order
      product.sort((a, b) => b.pName.localeCompare(a.pName))


        }else if(req.query.sort=='latest'){
          var product = await userHelper.userSingleProductCategory(req.query);

          product.sort((a, b) => new Date(b.date) - new Date(a.date));
          
        }else if(req.query.sort=='priceDesc'){
          var product = await userHelper.userSingleProductCategory(req.query);
        // Sort products by date in ascending order
        product.sort((a, b) => b.lPrice - a.lPrice);
          
        }

      }
  
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
        sortOrder: req.query.sortOrder,  // Ensure sortOrder is passed here
        search: req.query.search,
      });
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  
  
      
       // --------------------------------------------------------------------------------------------------------------

 
}