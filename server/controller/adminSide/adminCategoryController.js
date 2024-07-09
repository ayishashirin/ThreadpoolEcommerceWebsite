const Productdb = require("../../model/adminSide/productModel").Productdb;
const Categorydb = require("../../model/adminSide/category").Categorydb;

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
      console.log('dddddd');
      req.body.description = req.body.description?.trim();
      req.body.name = req.body.name?.trim();
  
      const errors = {};
      if (!req.body.name) errors.name = "This Field is required";
      if (!req.body.description) errors.description = "This Field is required";
  
      if (Object.keys(errors).length > 0) {
        req.session.sDetails = req.body;
        console.log('a');
        return res.status(401).json({ err: true, errors });
      }
      
      req.body.name = capitalizeFirstLetter(req.body.name);
      req.body.description = capitalizeFirstLetter(req.body.description);
      
      const isExists = await Categorydb.findOne({ name: req.body.name });
      
      if (isExists && String(isExists._id) !== req.params.categoryId) {
        req.session.catErr = "Category already exists";
        req.session.sDetails = req.body;
        console.log('b');
        return res.status(401).json({ err: true });
      }
  
      const oldCategory = await Categorydb.findOneAndUpdate(
        { _id: req.params.categoryId },
        { $set: req.body }
      );
  
      await Productdb.updateMany(
        { category: oldCategory.name },
        { $set: { category: req.body.name } }
      );
  
      res.status(200).json({ status: true });
    } catch (err) {
      console.log("ERROR in updateCategory", err);
      res.status(500).json({ err });
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
};
