const userHelper = require("../../databaseHelpers/userHelper");
const adminHelper = require("../../databaseHelpers/adminHelper");
const Productdb = require("../../model/adminSide/productModel").Productdb;
const ProductVariationdb =
  require("../../model/adminSide/productModel").ProductVariationdb;
const Cartdb = require("../../model/userSide/cartModel");
const orderdb = require("../../model/userSide/orderModel");



module.exports = {

    
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

      const wishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );

      res.status(200).render("userSide/editAddress", {
        category,
        userInfo,
        counts,
        user: req.session.isUserAuth,
        cartItems,
        wishlistItems
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

      const wishlistItems = await userHelper.getWishlistItemsAll(
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
          wishlistItems
        },
        (err, html) => {
          if (err) {
            console.log(err);
            return res.send(err);
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

}