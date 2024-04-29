const userHelper = require("../../databaseHelpers/userHelper");
const adminHelper = require("../../databaseHelpers/adminHelper");
const Productdb = require("../../model/adminSide/productModel").Productdb;
const ProductVariationdb =
  require("../../model/adminSide/productModel").ProductVariationdb;
const Cartdb = require("../../model/userSide/cartModel");
const orderdb = require("../../model/userSide/orderModel");

// ----------------------------------------------------------------------------------------------------

module.exports = {
  homePage: async (req, res) => {
    try {
      // User Helper function to get all listed categories
      const category = await userHelper.getAllListedCategory();

      // User Helper function to get the count of products in the cart
      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );

      // User Helper function to get newly launched products on the homepage
      const products = await userHelper.getProductDetails(null, true);

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render("userSide/userHome", {
        category,
        newProducts: products,
        user: req.session.isUserAuth,
        counts: counts,
        cartItems,
      });
    } catch (err) {
      console.error("Home page err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // -------------------------------------------------------------------------------------------------------------------------

  userLogin: async (req, res) => {
    try {
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      //userHelper fn to get counts of product in cart
      const counts = await userHelper.getTheCountOfWhislistCart(
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
        },
        (err, html) => {
          // Handle errors during rendering
          if (err) {
            console.error("Error rendering view:", err);
            return res.status(500).send("Internal Server Error");
          }

          // Delete the invalidUser property from the session after rendering the EJS file
          delete req.session.invalidUser;
          delete req.session.userId;
          delete req.session.verifyEmail;
          delete req.session.userBlockedMesg;
          delete req.session.email;
          delete req.session.password;
          delete req.session.userInfo;

          // Send the rendered HTML to the client
          res.send(html);
        }
      );
    } catch (err) {
      console.error("user side err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // -----------------------------------------------------------------------------------------------------------------------

  userEmailVerify: async (req, res) => {
    try {
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      //userHelper fn to get counts of product in cart
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
            return res.status(500).send("Internal Server Error");
          }

          delete req.session.isUser;

          res.send(html);
        }
      );
    } catch (err) {
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // --------------------------------------------------------------------------------------------------------------------

  userRegisterOtpVerify: async (req, res) => {
    try {
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      //userHelper fn to get counts of product in cart
      const counts = await userHelper.getTheCountOfWhislistCart(
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
        },
        (err, html) => {
          if (err) {
            console.log(err, "hrllohkdkdhfhk");
            return res.status(500).send("Internal Error");
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
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      //userHelper fn to get counts of product in cart
      const counts = await userHelper.getTheCountOfWhislistCart(
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
        },
        (err, html) => {
          if (err) {
            console.log("Register Page render Err:", err);
            return res.status(500).send("Internal Error");
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
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      //userHelper fn to get counts of product in cart
      const counts = await userHelper.getTheCountOfWhislistCart(
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
        },
        (err, html) => {
          if (err) {
            console.log("Register Page render Err:", err);
            return res.status(500).send("Internal Error");
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

  // -------------------------------------------------------------------------------------------------------------------

  userResetPassword: async (req, res) => {
    try {
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      //userHelper fn to get counts of product in cart
      const counts = await userHelper.getTheCountOfWhislistCart(
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
        },
        (err, html) => {
          if (err) {
            console.log("UserResetPass err", err);
            return res.status(500).send("Internal Server Error");
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

  // ----------------------------------------------------------------------------------------------------------------------

  showProductsCategory: async (req, res) => {
    try {
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

      //userHelper fn to get total number of products
      const totalProducts = await userHelper.userTotalProductNumber(
        req.params.category
      );

      //userHelper function to cheack if the product already exists in user cart
      const isCartItem = await userHelper.isProductCartItem(
        req.params.id,
        req.session.isUserAuth
      );

      //userHelper fn to get details of single product in buy now page
      const [singleProduct] = await userHelper.getProductDetails(req.params.productId);
        



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
        singleProduct
       
      });
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // --------------------------------------------------------------------------------------------------------------

  userProductDetails: async (req, res) => {
    try {
      //userHelper fn to get all listed category,counts of product in cart,all product in cart,related products,productDetails
      const category = await userHelper.getAllListedCategory();
      const relatedProducts = await userHelper.getRelatedProducts(
        req.params.productId
      );
      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      const wishListProducts = await userHelper.getWishlistItems(
        req.session.isUserAuth
      );
      //userHelper fn to get all listed category

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );
      const [singleProduct] = await userHelper.getProductDetails(
        req.params.productId
      );
      if (!singleProduct) {
        return res.status(401).redirect("/");
      }
      //userHelper function to cheack if the product already exists in user cart
      const isCartItem = await userHelper.isProductCartItem(
        req.params.id,
        req.session.isUserAuth
      );

      res.status(200).render("userSide/userProductDetails", {
        products: singleProduct,
        category,
        message: req.flash("message"),
        user: req.session.isUserAuth,
        relatedProducts: relatedProducts,
        counts,
        isCartItem,
        cartItems,
        wishListProducts,
      });
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // --------------------------------------------------------------------------------------------------

  userProfile: async (req, res) => {
    try {
      //userHelper fn to get all listed category,counts of product in cart,all product in cart
      const category = await userHelper.getAllListedCategory();
      const userInfo = await userHelper.userInfo(req.session.isUserAuth);

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );
      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );
      const referralOffer = await adminHelper.referralOffers();

      res.status(200).render("userSide/userProfile", {
        category,
        counts,
        user: req.session.isUserAuth,
        cartItems,
        userInfo,
        referralOffer,
      });
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // ------------------------------------------------------------------------------------------------------

  userUpdateAccount: async (req, res) => {
    try {
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );
      //userHelper fn to get all details of user
      const userInfo = await userHelper.userInfo(req.session.isUserAuth);

      const cartItems = await userHelper.getCartItemsAll(
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
        },
        (err, html) => {
          if (err) {
            console.log("Render err update ac");
            return res.send("Internal server err");
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

  userEditAddress: async (req, res) => {
    try {
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      //userHelper fn to get counts of product in cart and wishlist
      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );
      //userHelper fn to get all details of user
      const userInfo = await userHelper.userInfo(req.session.isUserAuth);

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render("userSide/editAddress", {
        category,
        userInfo,
        counts,
        user: req.session.isUserAuth,
        cartItems,
      });
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  addAddress: async (req, res) => {
    try {
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render(
        "userSide/addAddress",
        {
          category,
          sInfo: req.session.sAddress,
          errMesg: {
            name: req.session.name,
            country: req.session.country,
            district: req.session.district,
            state: req.session.state,
            city: req.session.city,
            houseNo: req.session.houseNo,
            houseName: req.session.houseName,
            pin: req.session.pin,
            exist: req.session.exist,
          },
          counts,
          user: req.session.isUserAuth,
          cartItems,
        },
        (err, html) => {
          if (err) {
            console.log("Render err update ac");
            return res.send("Internal server err");
          }

          delete req.session.name;
          delete req.session.country;
          delete req.session.district;
          delete req.session.state;
          delete req.session.city;
          delete req.session.houseNo;
          delete req.session.houseName;
          delete req.session.pin;
          delete req.session.sAddress;
          delete req.session.exist;

          res.send(html);
        }
      );
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  updateAddress: async (req, res) => {
    try {
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );

      //userHelper fn to get a single address for updating
      const address = await userHelper.getSingleAddress(
        req.session.isUserAuth,
        req.params.adId
      );

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render(
        "userSide/updateAddress",
        {
          category,
          sInfo: req.session.sAddress,
          address,
          errMesg: {
            name: req.session.name,
            country: req.session.country,
            district: req.session.district,
            state: req.session.state,
            city: req.session.city,
            houseNo: req.session.houseNo,
            houseName: req.session.houseName,
            pin: req.session.pin,
            exist: req.session.exist,
          },
          counts,
          user: req.session.isUserAuth,
          cartItems,
        },
        (err, html) => {
          if (err) {
            console.log("Render err update ac");
            return res.send("Internal server err");
          }

          delete req.session.name;
          delete req.session.country;
          delete req.session.district;
          delete req.session.state;
          delete req.session.city;
          delete req.session.houseNo;
          delete req.session.houseName;
          delete req.session.pin;
          delete req.session.exist;
          delete req.session.sAddress;

          res.send(html);
        }
      );
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

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

      res.render(
        "userSide/userAddCart",
        {
          category,
          cartItems,
          cartErr: req.session.cartErr,
          counts,
          user: req.session.isUserAuth,
        },
        (err, html) => {
          if (err) {
            return res.send(err);
            console.log(err);
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

  usersAddToWishList: async (req, res) => {
    try {
      //userHelper fn to get all listed category,counts of product in cart,all product in cart
      const category = await userHelper.getAllListedCategory();
      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );
      const WishListItems = await userHelper.getWishListItemsAll(
        req.session.isUserAuth
      );

      res.render(
        "userSide/userWishList",
        {
          category,
          WishListItems,
          counts,
          user: req.session.isUserAuth,
        },
        (err, html) => {
          if (err) {
            return res.send(err);
            console.log(err);
          }
          res.send(html);
        }
      );
    } catch (err) {
      console.log("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // -------------------------------------------------------------------------------------------------------------

  userCartCheckOut: async (req, res) => {
    try {
      let product;
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      //userHelper fn to get counts of product in cart and wishlist
      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );
      //userHelper fn to get all details of user
      const userInfo = await userHelper.userInfo(req.session.isUserAuth);
      product = await userHelper.getCartItemsAll(req.session.isUserAuth);
      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);

      res.status(200).render(
        "userSide/UserCheckout",
        {
          category,
          product: product,
          userInfo,
          errMesg: req.session.payErr,
          adErrMesg: req.session.adErr,
          counts,
          user: req.session.isUserAuth,
          cartItems,
          cartErr: req.session.cartErr,
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

  userOrderSuccessfull: async (req, res) => {
    try {
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      //userHelper fn to get counts of product in cart and wishlist
      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      res
        .status(200)
        .render(
          "userSide/orderPlacedSuccessfull",
          { category, counts, user: req.session.isUserAuth, cartItems },
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

  userCheckOut: async (req, res) => {
    try {
      if (!req.session.buyNowPro && Object.keys(req.query).length === 0) {
        return res.redirect("/");
      }
      let product;
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      //userHelper fn to get counts of product in cart and wishlist
      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );
      //userHelper fn to get all details of user
      const userInfo = await userHelper.userInfo(req.session.isUserAuth);
      if (req.query.payFrom === "cart") {
        req.session.isCartItem = true;

        //user Helper fn to get product all product in cart
        product = await userHelper.getCartItemsAll(req.session.isUserAuth);
      } else {
        delete req.session.isCartItem;

        //userHelper fn to get details of single product in payment page
        product = await userHelper.getProductDetails(req.session.buyNowPro.pId);
        product = product[0];
      }

      res.status(200).render(
        "userSide/userAddCart",
        {
          category,
          product: product,
          buyNowPro: req.session.buyNowPro,
          userInfo,
          errMesg: req.session.payErr,
          adErrMesg: req.session.adErr,
          cartPro: req.session.isCartItem,
          counts,
          user: req.session.isUserAuth,
        },
        (err, html) => {
          if (err) {
            console.log("payRender err", err);
            return res.send("Internal server err");
          }

          delete req.session.payErr;
          delete req.session.adErr;

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
      res.status(200).render("userSide/userOrderPage", {
        category,
        orders: orderItems.orders,
        counts,
        curentPage: Number(req.query.page),
        totalOrders: orderItems.totalOrders,
        user: req.session.isUserAuth,
        userInfo,
        cartItems,
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
      const orderDetails = await userHelper.getSingleOrderOfDetails(req.params,req.session.isUserAuth);

      //userHelper fn to get the userDetails
      const userInfo = await userHelper.userInfo(req.session.isUserAuth);

      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
       //userHelper fn to get all order history
       const orderItems = await userHelper.userGetAllOrder(req.session.isUserAuth,req.query.page);
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
        orderItems
      });
    } catch (err) {
      console.log("user order summary err err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  userWallet: async (req, res) => {
    try {
      //userHelper fn to get all listed category
      const category = await userHelper.getAllListedCategory();

      //userHelper fn to get counts of product in cart and wishlist
      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );

      //userHelper fn to get wallet details of specific user
      const userWallet = await userHelper.getUserWallet(req.session.isUserAuth);

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render("userSide/userWallet", {
        category,
        counts,
        userWallet,
        user: req.session.isUserAuth,
        cartItems,
      });
    } catch (err) {
      console.log("user Wallet err err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
};
