const userHelper = require("../../databaseHelpers/userHelper");
const adminHelper = require("../../databaseHelpers/adminHelper");
const Productdb = require("../../model/adminSide/productModel").Productdb;
const ProductVariationdb = require("../../model/adminSide/productModel").ProductVariationdb;
const Cartdb = require("../../model/userSide/cartModel");
const orderdb = require("../../model/userSide/orderModel");



module.exports = {


    showProductsCategory: async (req, res) => {
        try {
          // console.log(req.query,'dfldfjdlfjd')
          //userHelper fn to get all listed category
    
          const category = await userHelper.getAllListedCategory();
    
          //userHelper fn to get counts of product in cart
          const counts = await userHelper.getTheCountOfWhislistCart(
            req.session.isUserAuth
          );
    
          //userHelper fn to get product details of specific category
          const product = await userHelper.userSingleProductCategory(req.query);

          const cartItems = await userHelper.getCartItemsAll(
            req.session.isUserAuth
          );
          const wishlistItems = await userHelper.getWishlistItemsAll(
            req.session.isUserAuth
          );
    
          //userHelper fn to get total number of products
          const totalProducts = await userHelper.userTotalProductNumber(
            req.params.category
          );
    
          //userHelper function to cheack if the product already exists in user cart
          const isCartItem = await userHelper.isProductCartItem(
            req.params.id,
            req.session.isUserAuth
          );
          //userHelper function to cheack if the product already exists in user cart
          const iswishlistItem = await userHelper.isProductWishlistItem(
            req.params.id,
            req.session.isUserAuth
          );
    
          //userHelper fn to get details of single product in buy now page
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
            product:products,
            wishlistItems,
            iswishlistItem
           
          });
        } catch (err) {
          console.log("Update query err:", err);
          res.status(500).render("errorPages/500ErrorPage");
        }
      },

      
       // --------------------------------------------------------------------------------------------------------------

 
}