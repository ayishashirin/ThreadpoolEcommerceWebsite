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
      else if (req.body.discount > 75) errors.discount = 'Discount cannot be greater than 75%';
      else if (req.body.discount < 0) errors.discount = 'Discount should be between 0 and 75%';
  
      if (!req.body.count) errors.count = 'Max uses is required';
      else if (req.body.count <= 0) errors.count = 'Max uses should be greater than 0';
  
      if (!req.body.minPrice) errors.minPrice = 'Minimum price is required';
      else if (req.body.minPrice <= 25) errors.minPrice = 'Minimum price should be greater than 25';
  
      if (!req.body.expiry) errors.expiry = 'Expiry date is required';
      else {
        const expiryDate = new Date(req.body.expiry);
        if (expiryDate <= new Date()) errors.expiry = 'Expiry date must be in the future';
      }
  
      const isExisting = await adminHelper.adminCheckIfCouponExist(req.body.code);
      if (isExisting) errors.code = 'Coupon code already exists';
  
      if (Object.keys(errors).length) {
        req.session.savedDetails = req.body;
        req.session.errMesg = errors;
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
      const singleCoupon = await adminHelper.getAllCoupon(req.params.couponId);
  
      if (!singleCoupon) {
        return res.status(401).redirect("/adminCouponManagement");
      }
  
      res.status(200).render(
        "adminSide/adminUpdateCoupon",
        {
          savedDetails: req.session.savedDetails,
          errMesg: req.session.errMesg,
          singleCoupon,
        },
        (err, html) => {
          if (err) {
            console.error("Add Coupon render error", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }
  
          delete req.session.userId;
          delete req.session.code;
          delete req.session.discount;
          delete req.session.count;
          delete req.session.minPrice;
          delete req.session.expiry;
          delete req.session.savedDetails;
  
          res.status(200).send(html);
        }
      );
    } catch (err) {
      console.error("updatePage get error", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  
  adminUpdateCoupon: async (req, res) => {
    try {
      req.body.discount = req.body.discount?.trim();
      req.body.count = req.body.count?.trim();
      req.body.minPrice = req.body.minPrice?.trim();
      req.body.expiry = req.body.expiry?.trim();
  
      const errors = {};
      if (!req.body.code) errors.code = 'Coupon Code is required';
      if (!req.body.discount) errors.discount = 'Discount is required';
      else if (req.body.discount > 75) errors.discount = 'Discount cannot be greater than 75%';
      else if (req.body.discount < 0) errors.discount = 'Discount should be between 0 and 75%';
  
      if (!req.body.count) errors.count = 'Max uses is required';
      else if (req.body.count <= 0) errors.count = 'Max uses should be greater than 0';
  
      if (!req.body.minPrice) errors.minPrice = 'Minimum price is required';
      else if (req.body.minPrice <= 25) errors.minPrice = 'Minimum price should be greater than 25';
  
      if (!req.body.expiry) errors.expiry = 'Expiry date is required';
      else {
        const expiryDate = new Date(req.body.expiry);
        if (expiryDate <= new Date()) errors.expiry = 'Expiry date must be in the future';
      }
  
      const isExisting = await adminHelper.adminCheckIfCouponExist(req.body.code, req.params.couponId);
      if (isExisting) errors.code = 'Coupon code already exists';
  
      if (Object.keys(errors).length) {
        req.session.errMesg = errors;
        req.session.savedDetails = req.body;
        return res.status(401).redirect(`/adminCouponManagement/update/${req.params.couponId}`);
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
