const Productdb = require("../../model/adminSide/productModel").Productdb;
const ProductVariationdb =
  require("../../model/adminSide/productModel").ProductVariationdb;
const path = require("path");
const sharp = require("sharp");

module.exports = {
adminAddProduct : async (req, res) => {
    try {
      // Trim the form inputs
      req.body.pName = req.body.pName?.trim();
      req.body.pDescription = req.body.pDescription?.trim();
      req.body.fPrice = req.body.fPrice?.trim();
      req.body.lPrice = req.body.lPrice?.trim();
      req.body.discount = req.body.discount?.trim();
      req.body.color = req.body.color?.trim();
      req.body.size = req.body.size?.trim();
      req.body.quantity = req.body.quantity?.trim();
      req.body.date = req.body.date?.trim();
  
      // Validate form inputs
      const errors = {};
  
      if (!req.body.pName) errors.pName = "This Field is required";
      if (!req.body.pDescription) errors.pDescription = "This Field is required";
      if (!req.body.fPrice) errors.fPrice = "This Field is required";
      if (!req.body.lPrice) errors.lPrice = "This Field is required";
      if (!req.body.discount) errors.discount = "This Field is required";
      if (!req.body.color) errors.color = "This Field is required";
      if (!req.body.size) errors.size = "This Field is required";
      if (!req.body.quantity) errors.quantity = "This Field is required";
      if (req.body.quantity <= 0) errors.quantity = "Quantity must be greater than zero";
      if (!req.body.date) {
        errors.date = "This field is required";
      } else {
        const currentDate = new Date().toISOString().split('T')[0];
        if (req.body.date !== currentDate) {
          errors.date = "Date must be the current date";
        }
      }
      if (req.files.length === 0) errors.files = "This Field is required";
  
      const existingProduct = await Productdb.findOne({ pName: req.body.pName });
      if (existingProduct) errors.pName = "Product Name already exists";
  
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
          date: req.body.date,
        };
        req.flash("userProductFormData", userProductFormData);
        return res.status(401).redirect("/adminAddProduct");
      }
  
      const newlyLaunched = req.body.newlyLaunched === 'on';
      const unlistedProduct = req.body.unlistedProduct === 'on';
  
      const newProduct = new Productdb({
        pName: req.body.pName,
        category: req.body.category,
        pDescription: req.body.pDescription,
        fPrice: req.body.fPrice,
        lPrice: req.body.lPrice,
        newlyLaunched: newlyLaunched,
        unlistedProduct: unlistedProduct,
        date: req.body.date,
      });
  
      const savedProduct = await newProduct.save();
  
      const files = req.files;
      const uploadImg = files.map(value => `/uploadedImages/${value.filename}`);
      let arrImages = [];
  
      for (let i = 0; i < req.files.length; i++) {
        const croppedBuffer = await sharp(req.files[i].path)
          .resize({ width: 306, height: 408, fit: sharp.fit.cover })
          .toBuffer();
  
        const filename = `uploadedImages/cropped_${req.files[i].originalname}`;
        const sfilename = `cropped_${req.files[i].originalname}`;
        arrImages[i] = filename;
  
        const filePath = path.join(__dirname, "../../../public/uploadedImages", sfilename);
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
  
      res.redirect("/adminProductManagement");
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
    }

  

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

      req.body.pName = req.body.pName?.trim();
      req.body.category = req.body.category?.trim();
      req.body.pDescription = req.body.pDescription?.trim();
      req.body.fPrice = req.body.fPrice?.trim();
      req.body.lPrice = req.body.lPrice?.trim();
      req.body.discount = req.body.discount?.trim();
      req.body.color = req.body.color?.trim();
      req.body.size = req.body.size?.trim();
      req.body.quantity = req.body.quantity?.trim();
      req.body.date = req.body.date?.trim();

      const errors = {};

      const existingUpdateProduct = await Productdb.findOne({
        pName: req.body.pName,
      });
      const existingUpdateProductVariation = await ProductVariationdb.findOne({
        productId: existingUpdateProduct._id,
      });

      if (!req.body.pName) errors.pName = "This Field is required";
      if (!req.body.pName) errors.pName = "This Field is required";
      if (!req.body.pDescription) errors.pDescription = "This Field is required";
      if (!req.body.fPrice) errors.fPrice = "This Field is required";
      if (req.body.fPrice <= 0) errors.fPrice = "Quantity must be greater than zero";
      if (!req.body.lPrice) errors.lPrice = "This Field is required";
      if (req.body.quantity <= 0) errors.quantity = "Quantity must be greater than zero";
      if (!req.body.discount) errors.discount = "This Field is required";
      if (!req.body.color) errors.color = "This Field is required";
      if (!req.body.size) errors.size = "This Field is required";
      if (!req.body.quantity) errors.quantity = "This Field is required";
      if (req.body.quantity < 0) errors.quantity = "Quantity must be greater than zero";
      if (!req.body.date) {
        errors.date = "This field is required";
      } else {
        const currentDate = new Date().toISOString().split('T')[0]; 
        if (req.body.date !== currentDate) {
          errors.date = "Date must be the current date";
        }
      }
      if (!existingUpdateProductVariation.images.length && !req.files.length)
        errors.files = "This Field is required";

      if (
        existingUpdateProduct &&
        existingUpdateProduct._id.toString() !== req.query.id
      ) {
        errors.pName = "Product Name already exists";
      }

      if (Object.keys(errors).length > 0) {
        req.flash("userUpdateProductErrors", errors);
        const userUpdateProductFormData = {
          pName: req.body.pName,
          category: req.body.category,
          pDescription: req.body.pDescription,
          fPrice: req.body.fPrice,
          lPrice: req.body.lPrice,
          discount: req.body.discount,
          color: req.body.color,
          size: req.body.size,
          quantity: req.body.quantity,
          date: req.body.date,
        };
        console.log(errors, "Validation errors occurred");
        const refferer = req.get('Referer')
        return res.json({errors})
      }

      const updateProduct = {
        pName: req.body.pName,
        category: req.body.category,
        pDescription: req.body.pDescription,
        fPrice: req.body.fPrice,
        lPrice: req.body.lPrice,
        discount: req.body.discount,
        color: req.body.color,
        size: req.body.size,
        quantity: req.body.quantity,
        date: req.body.date,
      };

      await Productdb.updateOne({ _id: req.query.id }, { $set: updateProduct });

      const files = req.files;
      const uploadImg = files.map(
        (value) => `uploadedImages/${value.filename}`
      );

      const updateProductVariation = {
        color: req.body.color,
        size: req.body.size,
        quantity: req.body.quantity,
      };

      await ProductVariationdb.updateOne(
        { productId: req.query.id },
        { $set: updateProductVariation }
      );

      if (uploadImg.length > 0) {
        await ProductVariationdb.updateOne(
          { productId: req.query.id },
          { $push: { images: uploadImg } }
        );
      }

    
      return res.status(200).json(true);
    } catch (error) {
      console.error("Error occurred:", error);
      res.status(500).send("Internal Server Error");
    }
  },
};
