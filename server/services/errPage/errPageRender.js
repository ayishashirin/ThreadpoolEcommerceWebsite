const userHelper = require("../../databaseHelpers/userHelper");

module.exports = {
    errPage : async (req, res) => {
        try {
            //admin side 404 page
            if(req.session.adminPageErr){
                return res.status(404).render("errorPages/admin404Page");
            }

            //user side 404 page

            //userHelper fn to get all listed category
            const category = await userHelper.getAllListedCategory();
            const wishlistItems = await userHelper.getWishlistItemsAll(req.session.isUserAuth);
              
              //userHelper fn to get the userDetails
              const userInfo = await userHelper.userInfo(req.session.isUserAuth);
    
              const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
            
    
               //userHelper fn to get counts of product in cart and wishlist
               const counts = await userHelper.getTheCountOfWhislistCart(
                 req.session.isUserAuth
               );
         

            res.status(404).render('errorPages/user404Page', { category,user: req.session.isUserAuth,counts,cartItems,userInfo,wishlistItems,});
        } catch (err) {
            console.error('errPage err', err);
            res.status(500).render("errorPages/500ErrorPage",{category,user: req.session.isUserAuth,counts,cartItems,userInfo,wishlistItems,});
        }
    }
}