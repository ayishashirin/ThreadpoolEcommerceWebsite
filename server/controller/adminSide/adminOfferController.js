const adminHelper = require("../../databaseHelpers/adminHelper");

function capitalizeFirstLetter(str) {
  str = str.toLowerCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  adminAddOffer: async (req, res) => {
    try {
      req.body.productName = req.body.productName?.trim();
      req.body.productName = capitalizeFirstLetter(req.body.productName);
      req.body.category = req.body.category?.trim();
      req.body.category = capitalizeFirstLetter(req.body.category);
      req.body.discount = req.body.discount?.trim();

      if (!req.body.productName && !req.body.category) {
        req.session.productName = `This Field is required`;
      }

      if (!req.body.category && !req.body.productName) {
        req.session.category = `This Field is required`;
      }

      if (!req.body.discount) {
        req.session.discount = `This Field is required`;
      }

      let errors = {};

      if (!req.body.expiry) {
        req.session.expiry = "This field is required";
      } else {
        const currentDate = new Date();
        const expiryDate = new Date(req.body.expiry);
        
        if (expiryDate < currentDate) {
          errors.expiry = "Expiry date must be the current date or after the current date";
        }
      }
      
      

      if (req.body.discount && req.body.discount > 60) {
        req.session.discount = `Discount cannot be greater than 60%`;
      }

      if (req.body.discount && req.body.discount < 0) {
        req.session.discount = `Discount Should be in between 0 - 60%`;
      }
      if (
        req.session.productName ||
        req.session.category ||
        req.session.discount ||
        req.session.expiry
      
      ) {
        req.session.savedDetails = req.body;
        return res.status(401).redirect("/adminAddOffer");
      }
      console.log(req.body);
      const result = await adminHelper.saveOffer(req.body);
      if (result?.err) {
        console.log("errorrr");
        req.session.productName = result.productName;
        req.session.category = result.category;
        req.session.savedDetails = req.body;
        return res.status(401).redirect("/adminAddOffer");
      }
      
      res.status(200).redirect("/adminOfferManagement");
    } catch (err) {
      console.error("offer controller err in add coupon", err);
      res.status(500).send("Internal server err");
    }
  },
  adminUpdateOffer: async (req, res) => {
    try {
      req.body.productName = req.body.productName?.trim();
      req.body.productName = capitalizeFirstLetter(req.body.productName);
      req.body.category = req.body.category?.trim();
      req.body.category = capitalizeFirstLetter(req.body.category);
      req.body.discount = req.body.discount?.trim();
      req.body.expiry = req.body.expiry?.trim();

      if (!req.body.productName && !req.body.category) {
        req.session.productName = `This Field is required`;
      }

      if (!req.body.category && !req.body.productName) {
        req.session.category = `This Field is required`;
      }

      if (!req.body.discount) {
        req.session.discount = `This Field is required`;
      }
      let errors = {};

      if (!req.body.expiry) {
        req.session.expiry = "This field is required";
      } else {
        const currentDate = new Date()
        const expiryDate = new Date(req.body.expiry)
        if (expiryDate <= currentDate) {
          req.session.expiry = "Expiry date must be the current date or after the current date";
        }
      }
      
      if (req.body.discount && req.body.discount > 60) {
        req.session.discount = `Discount cannot be greater than 60%`;
      }

      if (req.body.discount && req.body.discount < 0) {
        req.session.discount = `Discount Should be in between 0 - 60%`;
      }
      if (
        (!req.body.productName || req.body.productName) &&
        req.body.category
      ) {
        const result = await adminHelper.isOfferExist(
          req.params.offerId,
          req.body
        );
        if (result?.err) {
          req.session.productName = result.productName;
          req.session.category = result.category;
        }
      }
      if (
        req.session.productName ||
        req.session.category ||
        req.session.discount ||
        req.session.expiry
      ) {
        req.session.savedDetails = req.body;
        return res.status(401).json({
          url: `/adminUpdateOffer/${req.params.offerId}`,
          status: true,
        });
      }
      await adminHelper.updateOffer(req.params.offerId, req.body);
      return res
        .status(200)
        .json({ url: `/adminOfferManagement`, status: true });
    } catch (err) {
      console.error("offer controller err in update offer", err);
      res.status(500).send("Internal server err");
    }
  },
  adminDeleteOffer: async (req, res) => {
    try {
      await adminHelper.adminDeleteOffer(req.params.offerId);

      res.status(200).json({
        url: "/adminOfferManagement",
        status: true,
      });
    } catch (err) {
      console.error("offer controller err in delete offer", err);
      res.status(500).send("Internal server err");
    }
  },
};
