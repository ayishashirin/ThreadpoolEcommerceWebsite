const express = require('express');

const router = express.Router();

const userRender = require('../../services/userSide/userRender');
const userController = require('../../controller/userSide/userController');
const authMiddleware = require('../../../middleware/userSide/authMiddleware/authMiddleware');
const wishlistController = require('../../controller/userSide/wishlistController');



// User Login Routes
router.route('/login')
    .get(
        authMiddleware.isUserAuth, 
        authMiddleware.noUserLoginResetPassword, 
        userRender.userLogin
    )
    .post(
        authMiddleware.isUserAuth, 
        userController.userLogin
    );



// User Register Routes
router.route('/register')
    .get(
        authMiddleware.noOtpVerify,
        authMiddleware.isUserAuth,
        userRender.userRegister
    )
    .post(
        authMiddleware.noOtpVerify,
        authMiddleware.isUserAuth,
        userController.userRegister
    );

router.route('/registerOtpVerify')
    .get(
        authMiddleware.otpVerify,
        authMiddleware.isUserAuth,
        userRender.userRegisterOtpVerify
    )
    .post(
        authMiddleware.otpVerify,
        authMiddleware.isUserAuth,
        userController.userRegisterOtpVerify
    );

    router.get('/userRegisterEmailVerifyResend', authMiddleware.otpVerify, authMiddleware.isUserAuth, userController.userRegisterEmailVerifyResend); // Resend otp in user register


// User Forgot Password Routes
router.get('/forgotPassword', authMiddleware.isUserAuth,authMiddleware.noUserLoginResetPassword, userRender.userForgotPassword); // frogot pass get

router.post('/loginEmailVerify', authMiddleware.simpleFindErrMiddleWare, userController.userLoginEmailVerify); // checking if given email is already a user

router.post('/loginOtpVerify', authMiddleware.simpleFindErrMiddleWare,userController.userLoginOtpVerify); // otp verify in forgot password page

router.get('/loginEmailVerifyResend',  authMiddleware.simpleFindErrMiddleWare,userController.userLoginEmailVerify); // resend otp in forgot password page


// User Reset Password Routes
router.route('/loginResetPassword')
    .get(
        authMiddleware.userLoginResetPassword,
        userRender.userResetPassword
    )
    .post(
        authMiddleware.userLoginResetPassword,
        userController.userLoginResetPass
    );




// User Home Routes
router.get('/', authMiddleware.isUserBlocked,userRender.homePage);



// User product listing

router.get('/Category', authMiddleware.isUserBlocked, userRender.showProductsCategory); // To list all product in given category for user

router.get('/productDetail/:productId', authMiddleware.isUserBlocked, userRender.userProductDetails);// Detail page for chosen product


// User Cart Routes (add product, remove products from cart and inc or dec qty of products in cart)

router.get('/addToCart', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userRender.usersAddToCart); // page to list all existing products in cart

router.get('/cartNow/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userCartNow);// Option to add new product to cart

router.get('/cartDelete/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userCartDelete);// Option to delete product from cart

router.get('/cartDeleteAll', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userCartDeleteAll);// Option to delete all product from cart


router.get('/cartItemUpdate/:productId/:values', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userCartItemUpdate);// Option to inc or dec qty of selected product in cart


// User Routes (payment from cart)



router.route('/cartCheckOut')
    .get(
        authMiddleware.isUserLoggedIn,
        authMiddleware.isUserBlocked,
        userRender.userCartCheckOut 
    )
    .post(
        authMiddleware.isUserLoggedIn,
        authMiddleware.isUserBlocked,
        userController.userCartCheckOut
    );




router.get('/orderSuccessfull', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked,userRender.userOrderSuccessfull); // order successful page when a order is placed

// User Order Routes (view orders, cancel orders, invoice download and order summary)
router.get('/orders', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userRender.userOrders);// User order history listing page

router.get('/orderCancel/:orderId/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userOrderCancel);// Option to cancel order of user

router.get('/orderDownloadInvoice/:productId/:orderId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userOrderDownloadInvoice); // Download invoice of delivered orders

router.get('/orderDetails/:orderId/:productId',  authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userRender.orderDetails)








// User Account Routes (view profile and Update)
router.get('/account', authMiddleware.isUserLoggedIn,authMiddleware.isUserBlocked, userRender.userProfile);




router.route('/updateAccount')
    .get(
        authMiddleware.isUserLoggedIn,
        authMiddleware.isUserBlocked,
        userRender.userUpdateAccount
    )
    .post(
        authMiddleware.isUserLoggedIn,
        authMiddleware.isUserBlocked,
        userController.userUpdateAccount
    );


// User Address Router (view address, change default, add, delete and update address)
router.get('/editAddress', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userRender.userEditAddress); // list all existing address page

router.get('/addAddress', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userRender.addAddress); // add new addres for user page

router.get('/changeDefault/:adId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userChangeDefault);// change default addres of the user 

router.get('/deleteAddress/:adId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.deleteAddress);// delete address of user

router.get('/editAddress/:adId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userRender.updateAddress);// Update address of user page

router.post('/UpdateAddress', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userupdateAddress); // Updates the new address 

router.post('/AddAddress', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userAddAddress);// adds new address




// User Order Routes (view orders, cancel orders, invoice download and order summary)
router.get('/orders', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userRender.userOrders);// User order history listing page
router.get('/wallet', authMiddleware.isUserLoggedIn,authMiddleware.isUserBlocked, userRender.userWallet)

// User wishlist Routes
// router.patch('/addToWishlist/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, wishlistController.addToWishlist);// Option to add a product to user wishlist

router.patch('/deleteWishlist/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, wishlistController.deleteFromWishlist);// Option to remove product form whislist

// User WishList Routes (add product and remove products from WishList)

router.get('/addToWishList', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userRender.usersAddToWishList); // page to list all existing products in WishList

router.get('/wishListNow/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userWishListNow);// Option to add new product to WishList

// router.get('/cartDelete/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userCartDelete);// Option to delete product from cart

// router.get('/cartDeleteAll', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userCartDeleteAll);// Option to delete all product from cart

router.post('/onlinePaymentSuccessfull', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.onlinePaymentSuccessfull); // online payment callback url for razor pay

router.post('/isCouponValidCart', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.isCouponValidCart)


    // logOut

router.get('/logOut', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userLogOut);


module.exports = router; 