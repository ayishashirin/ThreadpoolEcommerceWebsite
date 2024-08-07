const userHelper = require("../../databaseHelpers/userHelper");
const adminHelper = require("../../databaseHelpers/adminHelper");
const { Productdb } = require("../../model/adminSide/productModel");

// ----------------------------------------------------------------------------------------------------

module.exports = {
  homePage: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();
      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );
      const wishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );
      const products = await userHelper.getProductDetails(null, true);
      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );
      const isCartItem = await userHelper.isProductCartItem(
        req.params.id,
        req.session.isUserAuth
      );

      res.status(200).render("userSide/userHome", {
        category,
        newProducts: products,
        user: req.session.isUserAuth,
        counts: counts,
        toast: req.flash("toastMessage"),
        cartItems,
        wishlistItems,
        isCartItem,
      });
    } catch (err) {
      console.error("Home page err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // ------------------------------------------------------------------------------------------------------------------

  userLogin: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );

      const wishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render(
        "userSide/userLogin",
        {
          invalid: req.session.invalidUser,
          isBlock: req.session.userBlockedMesg,
          errMesg: {
            email: req.session.email,
            password: req.session.password,
            userInfo: req.session.userInfo,
          },
          category,
          user: req.session.isUserAuth,
          counts,
          cartItems,
          wishlistItems,
        },
        (err, html) => {
          if (err) {
            console.error("Error rendering view:", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.invalidUser;
          delete req.session.userId;
          delete req.session.verifyEmail;
          delete req.session.userBlockedMesg;
          delete req.session.email;
          delete req.session.password;
          delete req.session.userInfo;

          res.send(html);
        }
      );
    } catch (err) {
      console.error("user side err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // ------------------------------------------------------------------------------------------------------------------

  userEmailVerify: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render(
        "userSide/registerEmailVerify",
        {
          isUser: req.session.isUser,
          category,
          user: req.session.isUserAuth,
          counts,
          cartItems,
        },

        (err, html) => {
          if (err) {
            console.log(err);
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.isUser;

          res.send(html);
        }
      );
    } catch (err) {
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // -----------------------------------------------------------------------------------------------------------------

  userRegisterOtpVerify: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );
      const wishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );
      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render(
        "userSide/registerOtpVerify",
        {
          email: req.session.verifyEmail,
          errorMesg: req.session.otpError,
          rTime: req.session.rTime,
          category,
          user: req.session.isUserAuth,
          counts,
          cartItems,
          wishlistItems,
        },
        (err, html) => {
          if (err) {
            console.log(err, "hrllohkdkdhfhk");
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.otpError;
          delete req.session.rTime;

          res.send(html);
        }
      );
    } catch (err) {
      console.log(err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // ----------------------------------------------------------------------------------------------------------------

  userRegister: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );

      const wishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      const isReffered = await userHelper.userRegisterWithOrWithoutRefferal(
        req.query
      );

      let userInfo = req.flash("userRegisterFormData");
      let errMesg = req.flash("userRegisterErrors");

      if (userInfo) {
        userInfo = userInfo[0];
      }

      if (errMesg) {
        errMesg = errMesg[0];
      }

      res.status(200).render(
        "userSide/userRegister",
        {
          userInfo,
          errMesg,
          category,
          user: req.session.isUserAuth,
          counts,
          cartItems,
          isReffered,
          wishlistItems,
        },
        (err, html) => {
          if (err) {
            console.log("Register Page render Err:", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.userRegister;
          delete req.session.fName;
          delete req.session.phone;
          delete req.session.pass;
          delete req.session.conPass;
          delete req.session.bothPass;
          delete req.session.verifyOtpPage;
          delete req.session.email;

          res.status(200).send(html);
        }
      );
    } catch (err) {
      console.log(err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // ------------------------------------------------------------------------------------------------------------

  userForgotPassword: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );

      const wishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render(
        "userSide/userLoginForgotPassword",
        {
          errorMesg: req.session.emailError,
          otpErr: req.session.otpError,
          email: req.session.verifyEmail,
          rTime: req.session.rTime,
          category,
          user: req.session.isUserAuth,
          counts,
          cartItems,
          wishlistItems,
        },
        (err, html) => {
          if (err) {
            console.log("Register Page render Err:", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.emailError;
          delete req.session.otpError;
          delete req.session.rTime;

          res.status(200).send(html);
        }
      );
    } catch (err) {
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // ------------------------------------------------------------------------------------------------------------------

  userResetPassword: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );

      const wishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render(
        "userSide/userLoginResetPassword",
        {
          error: {
            comErr: req.session.errMesg,
            newPass: req.session.newPass,
            conPass: req.session.conPass,
          },
          category,
          user: req.session.isUserAuth,
          counts,
          cartItems,
          wishlistItems,
        },
        (err, html) => {
          if (err) {
            console.log("UserResetPass err", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.errMesg;
          delete req.session.newPass;
          delete req.session.conPass;

          res.status(200).send(html);
        }
      );
    } catch (err) {
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // -----------------------------------------------------------------------------------------------------------------

  userProfile: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();
      const userInfo = await userHelper.userInfo(req.session.isUserAuth);

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );
      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );
      const referralOffer = await adminHelper.referralOffers();

      const wishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render("userSide/userProfile", {
        category,
        counts,
        user: req.session.isUserAuth,
        cartItems,
        userInfo,
        referralOffer,
        wishlistItems,
      });
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // ------------------------------------------------------------------------------------------------------

  userUpdateAccount: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );
      const userInfo = await userHelper.userInfo(req.session.isUserAuth);

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      const wishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render(
        "userSide/userUpdateAccount",
        {
          category,
          sInfo: req.session.savedInfo,
          userInfo,
          errMesg: {
            fName: req.session.fName,
            email: req.session.email,
            phone: req.session.phone,
            oldPass: req.session.oldPass,
            password: req.session.password,
            cPass: req.session.cPass,
          },
          user: req.session.isUserAuth,
          counts,
          cartItems,
          wishlistItems,
        },
        (err, html) => {
          if (err) {
            console.log(err);
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.savedInfo;
          delete req.session.fName;
          delete req.session.email;
          delete req.session.phone;
          delete req.session.oldPass;
          delete req.session.password;
          delete req.session.cPass;

          res.send(html);
        }
      );
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // -------------------------------------------------------------------------------------------------------------

  userWallet: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );

      const userWallet = await userHelper.getUserWallet(req.session.isUserAuth);

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      const wishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render("userSide/userWallet", {
        category,
        counts,
        userWallet,
        user: req.session.isUserAuth,
        cartItems,
        wishlistItems,
      });
    } catch (err) {
      console.log(err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  userAboutUs: async (req, res) => {
    try {
      const category = await userHelper.getAllListedCategory();

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );

      const wishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );

      const products = await userHelper.getProductDetails(null, true);

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render("userSide/about", {
        category,
        newProducts: products,
        user: req.session.isUserAuth,
        counts: counts,
        cartItems,
        wishlistItems,
      });
    } catch (err) {
      console.error("Home page err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  searchProducts: async (req, res) => {
    try {
      const query = req.query.query;

      const regex = new RegExp("^" + query, "i");
      const ProductSearch = await userHelper.userSingleProductCategory(
        req.query
      );
      const filteredProducts = ProductSearch.filter((product) =>
        regex.test(product.pName)
      );
      const Products = [...filteredProducts];

      res.render("userSide/userSingleCategoryProducts", {
        products: Products,
        category: null,
        curentPage: null,
        currentCategory: null,
        user: req.session.isUserAuth,
        counts: null,
        cartItems: null,
        isCartItem: null,
        totalProducts: null,
        singleProduct: null,
        product: null,
        wishlistItems: null,
        iswishlistItem: null,
        size: null,
        collection: null,
        color: null,
        maxPrice: null,
        sortOrder: null, 
        search: null,
      });
    } catch (err) {
      console.error("Error fetching products:", err);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  },
};
