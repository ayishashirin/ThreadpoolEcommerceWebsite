const userHelper = require("../../databaseHelpers/userHelper");
const adminHelper = require("../../databaseHelpers/adminHelper");
const Productdb = require("../../model/adminSide/productModel").Productdb;
const ProductVariationdb =
  require("../../model/adminSide/productModel").ProductVariationdb;
const Cartdb = require("../../model/userSide/cartModel");
const orderdb = require("../../model/userSide/orderModel");


module.exports = {

    usersAddToCart: async (req, res) => {
        try {
          console.log("jiiiiiii");
    
          //userHelper fn to get all listed category,counts of product in cart,all product in cart
          const category = await userHelper.getAllListedCategory();
          const counts = await userHelper.getTheCountOfWhislistCart(
            req.session.isUserAuth
          );
          const cartItems = await userHelper.getCartItemsAll(
            req.session.isUserAuth
          );

          const wishlistItems = await userHelper.getWishlistItemsAll(
            req.session.isUserAuth
          );
          console.log("cartitems:",cartItems);

          res.render(
            "userSide/userAddCart",
            {
              category,
              cartItems,
              cartErr: req.session.cartErr,
              counts,
              user: req.session.isUserAuth,
              wishlistItems
            },
            (err, html) => {
              if (err) {
                 console.log(err);
                return res.send(err);
               
              }
              delete req.session.cartErr;
              res.send(html);
            }
          );
        } catch (err) {
          console.log("Update query err:", err);
          res.status(500).render("errorPages/500ErrorPage");
        }
      },

      userCartCheckOut: async (req, res) => {
        try {
        
          //userHelper fn to get all listed category
          const category = await userHelper.getAllListedCategory();
    
          //userHelper fn to get counts of product in cart and wishlist
          const counts = await userHelper.getTheCountOfWhislistCart(
            req.session.isUserAuth
          );

          const wishlistItems = await userHelper.getWishlistItemsAll(
            req.session.isUserAuth
          );
          //userHelper fn to get all details of user
          const userInfo = await userHelper.userInfo(req.session.isUserAuth);
          console.log(userInfo);
          const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
          const coupons =  await adminHelper.getAllCoupon();
          console.log(coupons);
          res.status(200).render(
            "userSide/UserCheckout",
            {
              category,
              userInfo,
              errMesg: req.session.payErr,
              adErrMesg: req.session.adErr,
              counts,
              user: req.session.isUserAuth,
              cartItems,
              cartErr: req.session.cartErr,
              coupons,
              wishlistItems
            },
            (err, html) => {
              if (err) {
                console.log(err);
                return res.send(err);
              }
    
              delete req.session.payErr;
              delete req.session.adErr;
              delete req.session.cartErr;
    
              res.send(html);
            }
          );
        } catch (err) {
          console.log("Update query err:", err);
          res.status(500).render("errorPages/500ErrorPage");
        }
      },

    
    
}