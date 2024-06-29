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
const passport = require('passport');

// Google Auth Routes
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));
  
  router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    successGoogleLogin
  );
  
  router.get('/failure', failureGoogleLogin);

router.get('/success', userController.successGoogleLogin); 
router.get('/failure', userController.failureGoogleLogin);

// User Home Routes
router.get('/', authMiddleware.isUserBlocked, userRender.homePage);

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

router.get('/userRegisterEmailVerifyResend', authMiddleware.otpVerify, authMiddleware.isUserAuth, userController.userRegisterEmailVerifyResend);

// User Forgot Password Routes
router.get('/forgotPassword', authMiddleware.isUserAuth, authMiddleware.noUserLoginResetPassword, userRender.userForgotPassword);

router.post('/loginEmailVerify', authMiddleware.simpleFindErrMiddleWare, userController.userLoginEmailVerify);

router.post('/loginOtpVerify', authMiddleware.simpleFindErrMiddleWare, userController.userLoginOtpVerify);

router.get('/loginEmailVerifyResend', authMiddleware.simpleFindErrMiddleWare, userController.userLoginEmailVerify);

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

// User product listing
router.get('/Category', authMiddleware.isUserBlocked, userCategoryRender.showProductsCategory);

router.get('/productDetail/:productId', authMiddleware.isUserBlocked, userProductRender.userProductDetails);

router.get('/addToCompare', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userProductRender.userAddToCompare);

router.get('/compareNow/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userCompareNow);

router.get('/compareDelete/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userCompareDelete);

// User Wishlist Routes
router.get('/addToWishlist', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userWishlistRender.userAddToWishlist);

router.get('/wishlistNow/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userWishlistController.userWishlistNow);

router.get('/wishlistDelete/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userWishlistController.userWishlistDelete);

router.get('/wishlistDeleteAll', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userWishlistController.userWishlistDeleteAll);

router.get('/wishlistItemUpdate/:productId/:values', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userWishlistController.userWishlistItemUpdate);

// User Cart Routes
router.get('/addToCart', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userCartRender.usersAddToCart);

router.get('/cartNow/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userCartController.userCartNow);

router.get('/cartDelete/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userCartController.userCartDelete);

router.get('/cartDeleteAll', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userCartController.userCartDeleteAll);

router.get('/cartItemUpdate/:productId/:values', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userCartController.userCartItemUpdate);

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

router.post('/isCouponValidCart', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userCartController.isCouponValidCart);

router.post('/onlinePaymentSuccessfull', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, razorPayController.onlinePaymentSuccessfull);

router.post('/onlinePaymentFailed', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, razorPayController.onlinePaymentFailed);

router.post('/payAgain', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, razorPayController.payAgain);

router.get('/wallet', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userRender.userWallet);

router.post('/walletOrder', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userCartController.userCartCheckOut);

// User Order Routes
router.get('/orderSuccessfull', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userOrderRender.userOrderSuccessfull);

router.get('/orderFailed', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userOrderRender.userOrderFailed);

router.get('/orders', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userOrderRender.userOrders);

router.post('/orderCancel/:orderId/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userOrderController.userOrderCancel);

router.get('/orderDetails/:orderId/:productId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userOrderRender.orderDetails);

router.post('/userOrderReturn/:orderItemId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userOrderController.userOrderReturn);

// User Account Routes
router.get('/account', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userRender.userProfile);

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

// User Address Router
router.get('/editAddress', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressRender.userEditAddress);

router.get('/addAddress', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressRender.addAddress);

router.get('/changeDefault/:adId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressController.userChangeDefault);

router.get('/deleteAddress/:adId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressController.deleteAddress);

router.get('/editAddress/:adId', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressRender.updateAddress);

router.post('/UpdateAddress', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressController.userupdateAddress);

router.post('/AddAddress', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressController.userAddAddress);

router.post('/api/changeAddressPayment', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userAddressController.changeAddressPayment);

// Other Routes
router.get('/aboutUs', userRender.userAboutUs);
router.get('/search', userRender.searchProducts);
router.get('/logOut', authMiddleware.isUserLoggedIn, authMiddleware.isUserBlocked, userController.userLogOut);

module.exports = router;
