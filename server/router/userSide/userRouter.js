const express = require('express');
const router = express.Router();
const userRender = require('../../services/userSide/userRender');
const userAddressRender = require('../../services/userSide/userAddressRender');
const userCategoryRender = require('../../services/userSide/userCategoryRender');
const userProductRender = require('../../services/userSide/userProductRender');
const userCartRender = require('../../services/userSide/userCartRender');
const userOrderRender = require('../../services/userSide/userOrderRender');
const userWishlistRender = require('../../services/userSide/userWishlistRender');
const userController = require('../../controller/userSide/userController');
const authMiddleware = require('../../../middleware/userSide/authMiddleware/authMiddleware');
const userWishlistController = require('../../controller/userSide/userWishlistController');
const userAddressController = require('../../controller/userSide/userAddressController');
const userCartController = require('../../controller/userSide/userCartController');
const userOrderController = require('../../controller/userSide/userOrderController');
const razorPayController = require('../../controller/userSide/razorPayController');

// -------------------------------------------------------------------------------------------------------------------------



// User Home Routes
router.get('/', authMiddleware.isUserBlocked,userRender.homePage);


// -----------------------------------------------------------------------------------------------------------------------------------


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

// --------------------------------------------------------------------------------------------------------------------------



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

// -----------------------------------------------------------------------------------------------------------------------------



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

// -----------------------------------------------------------------------------------------------------------------------



// User product listing

router.get('/Category', authMiddleware.isUserBlocked, userCategoryRender.showProductsCategory); // To list all product in given category for user

router.get('/productDetail/:productId', authMiddleware.isUserBlocked, userProductRender.userProductDetails);// Detail page for chosen product

// --------------------------------------------------------------------------------------------------------------------------------------



router.get('/addToWishlist', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userWishlistRender.userAddToWishlist); // page to list all existing products in WishList

router.get('/wishlistNow/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userWishlistController.userWishlistNow);// Option to add new product to WishList

router.get('/wishlistDelete/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userWishlistController.userWishlistDelete);// Option to delete product from cart

router.get('/wishlistDeleteAll', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userWishlistController.userWishlistDeleteAll);// Option to delete all product from cart

router.get('/wishlistItemUpdate/:productId/:values', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userWishlistController.userWishlistItemUpdate);// Option to inc or dec qty of selected product in cart



// --------------------------------------------------------------------------------------------------------------------

// User Cart Routes (add product, remove products from cart and inc or dec qty of products in cart)

router.get('/addToCart', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userCartRender.usersAddToCart); // page to list all existing products in cart

router.get('/cartNow/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userCartController.userCartNow);// Option to add new product to cart

router.get('/cartDelete/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userCartController.userCartDelete);// Option to delete product from cart

router.get('/cartDeleteAll', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userCartController.userCartDeleteAll);// Option to delete all product from cart


router.get('/cartItemUpdate/:productId/:values', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userCartController.userCartItemUpdate);// Option to inc or dec qty of selected product in cart

// User Routes (payment from cart)
router.route('/cartCheckOut')
    .get(
        authMiddleware.isUserLoggedIn,
        authMiddleware.isUserBlocked,
        userCartRender.userCartCheckOut 
    )
    .post(
        authMiddleware.isUserLoggedIn,
        authMiddleware.isUserBlocked,
        userCartController.userCartCheckOut
    );

    router.post('/isCouponValidCart', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userCartController.isCouponValidCart)

    router.post('/onlinePaymentSuccessfull', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, razorPayController.onlinePaymentSuccessfull); // online payment callback url for razor pay

    router.get('/wallet', authMiddleware.isUserLoggedIn,authMiddleware.isUserBlocked, userRender.userWallet)


// --------------------------------------------------------------------------------------------------------------------



// User Order Routes (view orders, cancel orders, invoice download and order summary)

router.get('/orderSuccessfull', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked,userOrderRender.userOrderSuccessfull); // order successful page when a order is placed

router.get('/orders', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userOrderRender.userOrders);// User order history listing page

router.get('/orderCancel/:orderId/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userOrderController.userOrderCancel);// Option to cancel order of user


router.get('/orderDetails/:orderId/:productId',  authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userOrderRender.orderDetails)


// --------------------------------------------------------------------------------------------------------------------------------


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
// ----------------------------------------------------------------------------------------------------------------------------



// User Address Router (view address, change default, add, delete and update address)
router.get('/editAddress', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressRender.userEditAddress); // list all existing address page

router.get('/addAddress', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressRender.addAddress); // add new addres for user page

router.get('/changeDefault/:adId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressController.userChangeDefault);// change default addres of the user 

router.get('/deleteAddress/:adId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressController.deleteAddress);// delete address of user

router.get('/editAddress/:adId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressRender.updateAddress);// Update address of user page

router.post('/UpdateAddress', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressController.userupdateAddress); // Updates the new address 

router.post('/AddAddress', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressController.userAddAddress);// adds new address

router.post('/api/changeAddressPayment', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressController.changeAddressPayment); // Option to change address from check out page
// --------------------------------------------------------------------------------------------------------------------


//Filter


// router.get('/sort',userController.Filter)







// logOut

router.get('/logOut', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userLogOut);


module.exports = router; 