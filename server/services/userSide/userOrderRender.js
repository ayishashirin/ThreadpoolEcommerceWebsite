const userHelper = require("../../databaseHelpers/userHelper");
const offerdb = require("../../model/adminSide/offerModel");
const userVariationdb = require("../../model/userSide/userVariationModel");
 


module.exports = {

    userOrderSuccessfull: async (req, res) => {
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
          const cartItems = await userHelper.getCartItemsAll(
            req.session.isUserAuth
          );
    
          res
            .status(200)
            .render(
              "userSide/orderPlacedSuccessfull",
              { category, counts, user: req.session.isUserAuth, cartItems,
                wishlistItems
               },
              (err, html) => {
                if (err) {
                  console.log(err);
                  return res.send("Internal server err");
                }
    
                delete req.session.orderSuccessPage;
    
                res.send(html);
              }
            );
        } catch (err) {
          console.log("Update query err:", err);
          res.status(500).render("errorPages/500ErrorPage");
        }
      },
    

      userOrders: async (req, res) => {
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
    
          const cartItems = await userHelper.getCartItemsAll(
            req.session.isUserAuth
          );
    
          //userHelper fn to get all order history
          const orderItems = await userHelper.userGetAllOrder(
            req.session.isUserAuth,
            req.query.page
          );

          const allOrderItems = await userHelper.getAllOrdersOfUser(req.session.isUserAuth)


          res.status(200).render("userSide/userOrderPage", {
            category,
            // orders: orderItems.orders,
            orders: allOrderItems,
            counts,
            curentPage: Number(req.query.page),
            totalOrders: orderItems.totalOrders,
            user: req.session.isUserAuth,
            userInfo,
            cartItems,
            wishlistItems,
            totalOrders: orderItems.totalOrders,
          });
        } catch (err) {
          console.log("Update query err:", err);
          res.status(500).render("errorPages/500ErrorPage");
        }
      },
    
      orderDetails: async (req, res) => {
        try {
          //userHelper fn to get all listed category
          const category = await userHelper.getAllListedCategory();
    
          //userHelper fn to get counts of product in cart and wishlist
          const counts = await userHelper.getTheCountOfWhislistCart(
            req.session.isUserAuth
          );
    
          //userHelper fn to get the order Details of singleProduct
          const orderDetails = await userHelper.getSingleOrderOfDetails(req.params,req.session.isUserAuth)
          console.log("orderDetails:",orderDetails);

           const offerDetails = await offerdb.find()
          const wishlistItems = await userHelper.getWishlistItemsAll(
            req.session.isUserAuth
          );
          //userHelper fn to get the userDetails
          const userInfo = await userHelper.userInfo(req.session.isUserAuth);

          const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);

             
         
          //  //userHelper fn to get all order history
          const orderAddress = await userVariationdb.find({userId:orderDetails.userId, address: {
            $elemMatch: { _id: orderDetails.address }
          }})
          if (!orderDetails) {
            return res.status(401).redirect("/orders");
          }
          
    
          res.status(200).render("userSide/userOrderSummaryPage", {
            category,
            counts,
            orderDetails,
            userInfo,
            user: req.session.isUserAuth,
            cartItems,
            wishlistItems,
            offerDetails,orderAddress,
        
          });
        } catch (err) {
          console.log("user order summary err err:", err);
          res.status(500).render("errorPages/500ErrorPage");
        }
      },

      
}