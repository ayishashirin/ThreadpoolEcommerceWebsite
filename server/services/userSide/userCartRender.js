const userHelper = require("../../databaseHelpers/userHelper");
const adminHelper = require("../../databaseHelpers/adminHelper");


module.exports = {

    usersAddToCart: async (req, res) => {
        try {
    
          
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
        
          const category = await userHelper.getAllListedCategory();
    
      
          const counts = await userHelper.getTheCountOfWhislistCart(
            req.session.isUserAuth
          );

          const wishlistItems = await userHelper.getWishlistItemsAll(
            req.session.isUserAuth
          );
          const userInfo = await userHelper.userInfo(req.session.isUserAuth);
          const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
          const coupons =  await adminHelper.getAllCoupon();
          res.status(200).render(
            "userSide/userCheckout",
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