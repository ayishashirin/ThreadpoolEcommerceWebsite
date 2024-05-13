const adminEmail = process.env.adminEmail;
const adminPassword = process.env.adminPass;
const mongodb = require("mongoose");
const Userdb = require("../../model/userSide/userModel");
const Productdb = require("../../model/adminSide/productModel").Productdb;
const ProductVariationdb =require("../../model/adminSide/productModel").ProductVariationdb;
const Categorydb = require("../../model/adminSide/category").Categorydb;
const path = require("path");
const adminHelper = require("../../databaseHelpers/adminHelper");
const json2csv = require("json2csv");
const sharp = require('sharp')



function capitalizeFirstLetter(str) {
  str = str.toLowerCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  adminLogin: (req, res) => {
    if (!req.body.email) {
      req.session.adminEmail = `This Field is required`;
    }

    if (!req.body.password) {
      req.session.adminPassword = `This Field is required`;
    }

    if (req.body.email && !/^[A-Za-z0-9]+@gmail\.com$/.test(req.body.email)) {
      req.session.adminEmail = `Not a valid Gmail address`;
    }

    if (req.session.adminEmail || req.session.adminPassword) {
      return res.status(401).redirect("/adminLogin");
    }
    if (req.body.password === adminPassword && req.body.email === adminEmail) {
      req.session.isAdminAuth = true;
      res.status(200).redirect("/adminHome"); //Login Sucessfull
    } else {
      req.session.invalidAdmin = `Invalid credentials!`;
      res.status(401).redirect("/adminLogin"); //Wrong Password or email
    }
  },


  
  
  
  adminUserStatus: async (req, res) => {
    if (!Number(req.params.block)) {
      await Userdb.updateOne(
        { _id: req.params.id },
        { $set: { userStatus: false, userLstatus: false } }
      );
      return res.status(200).redirect("/adminUserManagement");
    }
    await Userdb.updateOne(
      { _id: req.params.id },
      { $set: { userStatus: true } }
    );
    res.status(200).redirect("/adminUserManagement");
  },
  adminUserDelete: async (req, res) => {
    try {
      await Userdb.deleteOne({ _id: req.params.id });
      res.status(200).redirect("/adminUserManagement");
    } catch (err) {
      console.log("quer Err", err);
      res.status(401).send("Internal server err");
    }
  },
  adminLogout: (req, res) => {
    req.session.destroy();
    res.status(200).redirect("/adminLogin");
  },

  adminChangeOrderStatus: async (req, res) => {
    try {
      //function to change order status for admin
      await adminHelper.adminChangeOrderStatus(req.params.orderId, req.params.productId, req.body.orderStatus);

      //check for filter
      if (!req.body.filter) {
        
        console.log();
        return res.status(200).redirect("/adminOrderDetails");
      }

      if(Number(req.body.page)){
        return res.status(200).redirect(`/adminOrderDetails?filter=${req.body.filter}&page=${req.body.page}`);
      }
      res.status(200).redirect(`/adminOrderDetails?filter=${req.body.filter}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server err");
    }
  },
};
