const Productdb = require("../../model/adminSide/productModel").Productdb;
const ProductVariationdb =
  require("../../model/adminSide/productModel").ProductVariationdb;
const path = require("path");
const sharp = require("sharp");

module.exports = {
  adminAddProduct: async (req, res) => {
    try {
      req.body.pName = req.body.pName?.trim();
      req.body.pDescription = req.body.pDescription?.trim();
      req.body.fPrice = req.body.fPrice?.trim();
      req.body.lPrice = req.body.lPrice?.trim();
      req.body.discount = req.body.discount?.trim();
      req.body.color = req.body.color?.trim();
      req.body.size = req.body.size?.trim();
      req.body.quantity = req.body.quantity?.trim();

      const errors = {};

      if (!req.body.pName) errors.pName = "This Field is required";
      if (!req.body.pDescription)
        errors.pDescription = "This Field is required";
      if (!req.body.fPrice) errors.fPrice = "This Field is required";
      if (!req.body.lPrice) errors.lPrice = "This Field is required";
      if (!req.body.discount) errors.discount = "This Field is required";
      if (!req.body.color) errors.color = "This Field is required";
      if (!req.body.size) errors.size = "This Field is required";
      if (!req.body.quantity) errors.quantity = "This Field is required";
      if (req.body.quantity <= 0)
        errors.quantity = "Quantity must be greater than zero";
    
      if (req.files.length === 0) errors.files = "This Field is required";

      const existingProduct = await Productdb.findOne({
        pName: req.body.pName,
      });
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
        };
        req.flash("userProductFormData", userProductFormData);
        return res.status(401).redirect("/adminAddProduct");
      }

      const newlyLaunched = req.body.newlyLaunched === "on";
      const unlistedProduct = req.body.unlistedProduct === "on";

      const newProduct = new Productdb({
        pName: req.body.pName,
        category: req.body.category,
        pDescription: req.body.pDescription,
        fPrice: req.body.fPrice,
        lPrice: req.body.lPrice,
        newlyLaunched: newlyLaunched,
        unlistedProduct: unlistedProduct,
      });

      const savedProduct = await newProduct.save();

      const files = req.files;
      const uploadImg = files.map(
        (value) => `/uploadedImages/${value.filename}`
      );
      let arrImages = [];

      for (let i = 0; i < req.files.length; i++) {
        const croppedBuffer = await sharp(req.files[i].path)
          .resize({ width: 306, height: 408, fit: sharp.fit.cover })
          .toBuffer();

        const filename = `uploadedImages/cropped_${req.files[i].originalname}`;
        const sfilename = `cropped_${req.files[i].originalname}`;
        arrImages[i] = filename;

        const filePath = path.join(
          __dirname,
          "../../../public/uploadedImages",
          sfilename
        );
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
      const { pName, category, pDescription, fPrice, lPrice, discount, color, size, quantity } = req.body;
      const errors = {};

      if (!pName?.trim()) errors.pName = "This Field is required";
      if (!pDescription?.trim()) errors.pDescription = "This Field is required";
      if (!fPrice?.trim() || parseFloat(fPrice) <= 0) errors.fPrice = "Price must be greater than zero";
      if (!lPrice?.trim()) errors.lPrice = "This Field is required";
      if (!quantity?.trim() || parseInt(quantity, 10) <= 0) errors.quantity = "Quantity must be greater than zero";
      if (!discount?.trim()) errors.discount = "This Field is required";
      if (!color?.trim()) errors.color = "This Field is required";
      if (!size?.trim()) errors.size = "This Field is required";

      const existingUpdateProduct = await Productdb.findOne({ pName: pName?.trim() });

      if (existingUpdateProduct && existingUpdateProduct._id.toString() !== req.query.id) {
        errors.pName = "Product Name already exists";
      }

      if (!existingUpdateProduct) {
        errors.pName = "Product not found";
      } else {
        const existingUpdateProductVariation = await ProductVariationdb.findOne({ productId: existingUpdateProduct._id });
        if (!existingUpdateProductVariation.images.length && !req.files.length) {
          errors.files = "This Field is required";
        }
      }

      if (Object.keys(errors).length > 0) {
        req.flash("userUpdateProductErrors", errors);
        return res.json({ errors });
      }

      const updateProduct = {
        pName: pName.trim(),
        category: category?.trim(),
        pDescription: pDescription.trim(),
        fPrice: parseFloat(fPrice),
        lPrice: parseFloat(lPrice),
        discount: discount?.trim(),
      };

      await Productdb.updateOne({ _id: req.query.id }, { $set: updateProduct });

      const uploadImg = req.files.map((value) => `/uploadedImages/${value.filename}`);
      await ProductVariationdb.updateOne(
        { productId: req.query.id },
        {
          $set: { color: color.trim(), size: size.trim(), quantity: parseInt(quantity, 10) },
          ...(uploadImg.length > 0 && { $push: { images: uploadImg } }),
        }
      );

      return res.status(200).json(true);
    } catch (error) {
      console.error("Error occurred:", error);
      res.status(500).send("Internal Server Error");
    }
  },
};
