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
  adminAddProduct: async (req, res) => {
    try {
      
     
      // Trim whitespace from form fields
      req.body.pName = req.body.pName?.trim();
      req.body.pDescription = req.body.pDescription?.trim();
      req.body.fPrice = req.body.fPrice?.trim();
      req.body.lPrice = req.body.lPrice?.trim();
      req.body.discount = req.body.discount?.trim();
      req.body.color = req.body.color?.trim();
      req.body.size = req.body.size?.trim();
      req.body.quantity = req.body.quantity?.trim();

      // Validate form inputs
      const errors = {};

      // Check for required fields
      if (!req.body.pName) errors.pName = "This Field is required";
      if (!req.body.pDescription)
        errors.pDescription = "This Field is required";
      if (!req.body.fPrice) errors.fPrice = "This Field is required";
      if (!req.body.lPrice) errors.lPrice = "This Field is required";
      if (!req.body.discount) errors.discount = "This Field is required";
      if (!req.body.color) errors.color = "This Field is required";
      if (!req.body.size) errors.size = "This Field is required";
      if (!req.body.quantity) errors.quantity = "This Field is required";
      if (req.files.length === 0) errors.files = "This Field is required";

      // Check for existing product with the same name
      const existingProduct = await Productdb.findOne({
        pName: req.body.pName,
      });
      if (existingProduct) errors.pName = "Product Name already exists";

      // If there are validation errors, redirect back to the form with error messages
      if (Object.keys(errors).length > 0) {
        req.flash("userProductErrors", errors);
        const userProductFormData = {
          pName: req.body.pName,
          pDescription: req.body.pDescription,
          fPrice: req.body.fPrice,
          lPrice: req.body.lPrice,
          discount: req.body.discount,
          color: req.body.color,
          size: req.body.size,
          quantity: req.body.quantity,
        };
        req.flash("userProductFormData", userProductFormData);
        console.log(errors,'dfdfdfdhfhgdhg');
        return res.status(401).redirect("/adminAddProduct");
      }

      // Create a new product
      const newlyLaunched = req.body.newlyLaunched || false;
      const newProduct = new Productdb({
        pName: req.body.pName,
        category: req.body.category,
        pDescription: req.body.pDescription,
        fPrice: req.body.fPrice,
        lPrice: req.body.lPrice,
        newlyLaunched: newlyLaunched,
      });

      // Save the new product to the database
      const savedProduct = await newProduct.save();

      // Process file uploads and save file paths to the database
      const files = req.files;
      const uploadImg = files.map(
        (value) => `/uploadedImages/${value.filename}`
      );
      let arrImages = [];
      console.log(req.files);

      for (let i = 0; i < req.files.length; i++) {

        console.log(req.files[i].path);
          // Use sharp to resize and crop the image
          const croppedBuffer = await sharp(req.files[i].path)
              .resize({ width: 306, height: 408, fit: sharp.fit.cover })
              .toBuffer();

          const filename = `uploadedImages/cropped_${req.files[i].originalname}`;
          const sfilename = `cropped_${req.files[i].originalname}`;
          arrImages[i] = filename;

          // Save the cropped image
          const filePath = path.join(__dirname, '../../../public/uploadedImages', sfilename);
          console.log(filePath);
          await sharp(croppedBuffer).toFile(filePath);
      }

      const newProductVariation = new ProductVariationdb({
        productId: savedProduct._id,
        color: req.body.color,
        size: req.body.size,
        quantity: req.body.quantity,
        images: arrImages,
      });
      await newProductVariation.save();

      // Redirect to product management page after successful addition
      res.redirect("/adminProductManagement");
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
    }
  },

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
console.log(req.body,"asdfghjkl");
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
  adminSoftDeleteProduct: async (req, res) => {
    const data = await Productdb.updateOne(
      { _id: req.params.id },
      { $set: { unlistedProduct: true } }
    );

    res.redirect("/adminProductManagement");
  },
  adminRestoreProduct: async (req, res) => {
    const data = await Productdb.updateOne(
      { _id: req.params.id },
      { $set: { unlistedProduct: false } }
    );

    res.redirect("/adminUnlistedProduct");
  },
  adminDeleteProductImg: async (req, res) => {
    const fileImg = await ProductVariationdb.findOneAndUpdate(
      { productId: req.query.id },
      { $unset: { [`images.${req.query.index}`]: 1 } }
    );

    await ProductVariationdb.updateOne(
      { productId: req.query.id },
      { $pull: { images: null } }
    );

    res.status(200).redirect(`/adminUpdateProduct/${req.query.id}`);
  },
  
  adminUpdateProduct: async (req, res) => {
    try {
      console.log(req.query, "ayshaaaaa")
      // Trim whitespace from form fields
      req.body.pName = req.body.pName?.trim();
      req.body.pDescription = req.body.pDescription?.trim();
      req.body.fPrice = req.body.fPrice?.trim();
      req.body.lPrice = req.body.lPrice?.trim();
      req.body.discount = req.body.discount?.trim();
      req.body.color = req.body.color?.trim();
      req.body.size = req.body.size?.trim();
      req.body.quantity = req.body.quantity?.trim();
  
      // Validate form inputs
      const errors = {};

    console.log("hhhhhhh");
  
      // Check for required fields
      if (!req.body.pName) errors.pName = "This Field is required";
      if (!req.body.pDescription)
        errors.pDescription = "This Field is required";
      if (!req.body.fPrice) errors.fPrice = "This Field is required";
      if (!req.body.lPrice) errors.lPrice = "This Field is required";
      if (!req.body.discount) errors.discount = "This Field is required";
      if (!req.body.color) errors.color = "This Field is required";
      if (!req.body.size) errors.size = "This Field is required";
      if (!req.body.quantity) errors.quantity = "This Field is required";
      if (req.files.length === 0) errors.files = "This Field is required";
  
      console.log("uuuuuuu");
      // Check for existing product with the same name
      const existingUpdateProduct = await Productdb.findOne({
        pName: req.body.pName,
      });
      if (existingUpdateProduct && existingUpdateProduct._id.toString() !== req.query.id) {
        errors.pName = "Product Name already exists";
      }
  
      // If there are validation errors, redirect back to the form with error messages
      if (Object.keys(errors).length > 0) {
        req.flash("userUpdateProductErrors", errors);
        const userUpdateProductFormData = {
          pName: req.body.pName,
          pDescription: req.body.pDescription,
          fPrice: req.body.fPrice,
          lPrice: req.body.lPrice,
          discount: req.body.discount,
          color: req.body.color,
          size: req.body.size,
          quantity: req.body.quantity,
        };
        req.flash("userUpdateProductFormData", userUpdateProductFormData);
        console.log(errors, 'Validation errors occurred');
        return res.redirect(`/adminUpdateProduct/${req.query.id}`);
      }
  
      // Update product information in the database
      const updateProduct = {
        pName: req.body.pName,
        category: req.body.category,
        pDescription: req.body.pDescription,
        fPrice: req.body.fPrice,
        lPrice: req.body.lPrice,
        size: req.body.size,
        newlyLaunch: req.body.newlyLaunch ? true : false, // corrected spelling
      };
  
      await Productdb.findOne({_id: req.query.id});
      await Productdb.updateOne({ _id: req.query.id }, { $set: updateProduct });
  
      const files = req.files;
      console.log(files);
      const uploadImg = files.map((value) => `/uploadedImages/${value.filename}`);
  
      // Update product variation information in the database
      const updateProductVariation = {
        color: req.body.color,
        size: req.body.size,
        quantity: req.body.quantity,
      };
  
      await ProductVariationdb.updateOne(
        { productId: req.query.id },
        { $set: updateProductVariation }
      );
  
      // Push uploaded images to the product variation
      if (uploadImg.length > 0) {
        await ProductVariationdb.updateOne(
          { productId: req.query.id },
          { $push: { images: uploadImg } }
          );
      }
  
      // Redirect to admin product management page after successful update
      return res.status(200).json(true);
    } catch (error) {
      // Handle any errors
      console.error("Error occurred:", error);
      // Redirect to an error page or send an error response as necessary
      res.status(500).send("Internal Server Error");
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
        return res.status(200).redirect("/adminOrderManagement");
      }

      if(Number(req.body.page)){
        return res.status(200).redirect(`/adminOrderManagement?filter=${req.body.filter}&page=${req.body.page}`);
      }
      res.status(200).redirect(`/adminOrderManagement?filter=${req.body.filter}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server err");
    }
  },
};
