const adminHelper = require("../../databaseHelpers/adminHelper");

module.exports = {
  adminAddCoupon: async (req, res) => {
    try {
      req.body.discount = req.body.discount?.trim();
      req.body.count = req.body.count?.trim();
      req.body.minPrice = req.body.minPrice?.trim();
      req.body.expiry = req.body.expiry?.trim();
  
      const errors = {};
      if (!req.body.code) errors.code = 'Coupon Code is required';
      if (!req.body.discount) errors.discount = 'Discount is required';
      if (!req.body.count) errors.count = 'Max uses is required';
      if (!req.body.minPrice) errors.minPrice = 'Minimum price is required';
      if (!req.body.expiry) errors.expiry = 'Expiry date is required';
  
      if (Object.keys(errors).length) {
        req.session.savedDetails = req.body;
        req.session.errMesg = errors;
        return res.status(401).redirect("/adminAddCoupon");
      }
  
      if (req.body.discount > 95 || req.body.discount < 0) {
        req.session.savedDetails = req.body;
        req.session.errMesg = { discount: 'Discount should be between 0 and 95%' };
        return res.status(401).redirect("/adminAddCoupon");
      }
  
      const isExisting = await adminHelper.adminCheckIfCouponExist(req.body.code);
      if (isExisting) {
        req.session.savedDetails = req.body;
        req.session.errMesg = { code: 'Coupon code already exists' };
        return res.status(401).redirect("/adminAddCoupon");
      }
  
      const expiryDate = new Date(req.body.expiry);
      if (expiryDate <= new Date()) {
        req.session.savedDetails = req.body;
        req.session.errMesg = { expiry: 'Expiry date must be in the future' };
        return res.status(401).redirect("/adminAddCoupon");
      }
  
      await adminHelper.addCoupon(req.body);
  
      res.status(200).redirect("/adminCouponManagement");
    } catch (err) {
      console.error("Coupon controller error in add coupon:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  
  
  
  adminUpdateCoupon: async (req, res) => {
    try {
      req.body.code = req.body.code?.trim();
      req.body.discount = req.body.discount?.trim();
      req.body.count = req.body.count?.trim();
      req.body.minPrice = req.body.minPrice?.trim();
      req.body.expiry = req.body.expiry?.trim();
  
      const errors = {};
      if (!req.body.code) errors.code = 'Coupon Code is required';
      if (!req.body.discount) errors.discount = 'Discount is required';
      if (!req.body.count) errors.count = 'Max uses is required';
      if (!req.body.minPrice) errors.minPrice = 'Minimum price is required';
      if (!req.body.expiry) errors.expiry = 'Expiry date is required';
  
      if (req.body.discount > 95) errors.discount = 'Discount cannot be greater than 95%';
      if (req.body.discount < 0) errors.discount = 'Discount should be between 0 and 95%';
  
      const isExisting = await adminHelper.adminCheckIfCouponExist(req.body.code, req.params.couponId);
      if (isExisting) errors.code = 'Coupon code already exists';
  
      const expiryDate = new Date(req.body.expiry);
      if (expiryDate <= new Date()) errors.expiry = 'Expiry date must be in the future';
  
      if (Object.keys(errors).length) {
        req.session.errMesg = errors;
        req.session.savedDetails = req.body;
        return res.status(401).json({
          errors,
          status: true,
        });
      }
  
      await adminHelper.adminUpdateCoupon(req.params.couponId, req.body);
  
      res.status(200).json({
        url: "/adminCouponManagement",
        status: true,
      });
    } catch (err) {
      console.error("Coupon controller error in update coupon:", err);
      res.status(500).json({
        message: "Internal server error",
        errStatus: true,
      });
    }
  },
  

  adminDeleteCoupon: async (req, res) => {
    try {
      await adminHelper.adminDeleteCoupon(req.params.couponId);

      res.status(200).json({
        url: "/adminCouponManagement",
        status: true,
      });
    } catch (err) {
      console.error("coupon controller err in delete coupon", err);
      res.status(500).json({
        message: "Internal server err",
        errStatus: true,
      });
    }
  },
};
