
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


adminAddCategory: async (req, res) => {
    try {
      req.body.description = req.body.description.trim();
      req.body.name = req.body.name.trim();

      if (!req.body.description) {
        req.session.dErr = `This Field is required`;
      }

      if (!req.body.name) {
        req.session.catErr = `This Field is required`;
      }

      if (req.session.dErr || req.session.catErr) {
        req.session.sDetails = req.body;
        return res.status(200).redirect("/adminAddCategory");
      }

      req.body.name = capitalizeFirstLetter(req.body.name);
      req.body.description = capitalizeFirstLetter(req.body.description);
      const newCat = new Categorydb(req.body);

      await newCat.save();

      res.status(200).redirect("/adminCategoryManagement");
    } catch (err) {
      req.session.sDetails = req.body;
      req.session.catErr = `Category already exist`;
      res.status(401).redirect("/adminAddCategory");
    }
  },



    updateCategory: async (req, res) => {
        try {

            console.log("1");
            req.body.description = req.body.description?.trim();
            req.body.name = req.body.name?.trim();
            

            const errors = {};
            if (!req.body.name) errors.name = "This Field is required";
            if (!req.body.description)errors.description = "This Field is required";


            if(req.session.dErr || req.session.catErr){
                req.session.sDetails = req.body;
                return res.status(401).json({err: true});
            }

            req.body.name = capitalizeFirstLetter(req.body.name);
            req.body.description = capitalizeFirstLetter(req.body.description);

            const isExisits = await Categorydb.findOne({name: req.body.name});

            if(isExisits && String(isExisits._id) !== req.params.categoryId){
                req.session.catErr = `Category already exist`;
                req.session.sDetails = req.body;
                return res.status(401).json({err: true});
            }

            const oldCategory = await Categorydb.findOneAndUpdate({_id: req.params.categoryId}, {$set: req.body});

            await Productdb.updateMany({category: oldCategory.name}, {$set: {category: req.body.name}});

           res.redirect('/adminCategoryManagement')
        } catch (err) {
            console.log('ERROR in updateCategory', err);
            res.status(500).json({err});
        }
    
},
  adminSoftDeleteCategory: async (req, res) => {
    await Categorydb.updateOne(
      { _id: req.params.id },
      { $set: { status: false } }
    );
    res.status(200).redirect("/adminCategoryManagement");
  },
  adminRestoreCategory: async (req, res) => {
    await Categorydb.updateOne(
      { _id: req.params.id },
      { $set: { status: true } }
    );
    res.status(200).redirect("/adminUnlistedCategory");
  },

}