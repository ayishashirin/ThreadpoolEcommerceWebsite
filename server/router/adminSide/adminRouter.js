const express = require("express");
const router = express.Router();
const adminRender = require("../../services/adminSide/adminRender");
const adminController = require("../../controller/adminSide/adminController");
const adminCategoryController = require("../../controller/adminSide/adminCategoryController");
const adminProductController = require("../../controller/adminSide/adminProductController");
const adminAuthMiddleware = require("../../../middleware/adminSide/authMiddleware/adminAuthMiddleware");
const store = require("../../controller/adminSide/multer");
const referralOfferController = require("../../controller/adminSide/adminReferralOfferController");
const adminOfferController = require("../../controller/adminSide/adminOfferController");
const adminCouponController = require("../../controller/adminSide/adminCouponController");
const ejs = require("ejs");
const salesController = require("../../controller/adminSide/salesController");

// Admin Login Routes
router
    .route("/adminLogin")
    .get(adminAuthMiddleware.noAdminAuth, adminRender.adminLogin)
    .post(adminAuthMiddleware.noAdminAuth, adminController.adminLogin);

// Admin Dashboard Route
router.get(
    "/adminHome",
    adminAuthMiddleware.isAdminAuth,
    adminRender.adminHome
); // get the page of dashboard

router.get(
    "/getSalesReport",
    adminAuthMiddleware.isAdminAuth,
    salesController.getSalesReport
); // Option to download sales report
router.get(
    "/getSalesReportfilter",
    adminAuthMiddleware.isAdminAuth,
    adminRender.getSalesReportfilter
);

router.post(
    "/api/getDetailsChart",
    adminAuthMiddleware.isAdminAuth,
    adminController.getDetailsChart
); // Option to get chart details
router.get(
    "/getCustomChart",
    adminAuthMiddleware.isAdminAuth,
    adminRender.getCustomChart
);
// Admin Product Management Routes
router.get(
    "/adminProductManagement",
    adminAuthMiddleware.isAdminAuth,
    adminRender.adminProductManagement
); // Product is listed in Page to manage

router.get(
    "/adminUnlistedProduct",
    adminAuthMiddleware.isAdminAuth,
    adminRender.adminUnlistedProduct
); // To manage unlisted product

router
    .route("/adminAddProduct")
    .get(adminAuthMiddleware.isAdminAuth, adminRender.adminAddProducts)
    .post(
        adminAuthMiddleware.isAdminAuth,
        store.array("image", 4),
        adminProductController.adminAddProduct
    );

router.get(
    "/adminSoftDeleteProduct/:id",
    adminAuthMiddleware.isAdminAuth,
    adminProductController.adminSoftDeleteProduct
); // Option to make product unlisted

router.get(
    "/adminRestoreProduct/:id",
    adminAuthMiddleware.isAdminAuth,
    adminProductController.adminRestoreProduct
); // Option to make product listed

router.get(
    "/adminUpdateProduct/:id",
    adminAuthMiddleware.isAdminAuth,
    adminRender.adminUpdateProduct
); // Update product page

router.get(
    "/adminDeleteProductImg",
    adminAuthMiddleware.isAdminAuth,
    adminProductController.adminDeleteProductImg
); // Option to delete img of product without unlink it's soft delete

router.post(
    "/adminUpdateProduct",
    adminAuthMiddleware.isAdminAuth,
    store.array("fileInput", 4),
    adminProductController.adminUpdateProduct
); // Updates the product

// Admin Category Management Routes
router.get(
    "/adminCategoryManagement",
    adminAuthMiddleware.isAdminAuth,
    adminRender.adminCategoryManagement
); // all listed category can be managed

router.get(
    "/adminUnlistedCategory",
    adminAuthMiddleware.isAdminAuth,
    adminRender.adminUnlistedCategory
); // all unlisted category can be manage

router
    .route("/adminAddCategory")
    .get(adminAuthMiddleware.isAdminAuth, adminRender.adminAddCategory)
    .post(
        adminAuthMiddleware.isAdminAuth,
        adminCategoryController.adminAddCategory
    );

router
    .route("/adminUpdateCategory/:categoryId")
    .get(adminAuthMiddleware.isAdminAuth, adminRender.updateCategory)
    .put(
        adminAuthMiddleware.isAdminAuth,
        adminCategoryController.updateCategory
    );

router.get(
    "/adminSoftDeleteCategory/:id",
    adminAuthMiddleware.isAdminAuth,
    adminCategoryController.adminSoftDeleteCategory
); // Option to make category unlisted

router.get(
    "/adminRestoreCategory/:id",
    adminAuthMiddleware.isAdminAuth,
    adminCategoryController.adminRestoreCategory
); // Option to make category listed

// Admin User Management Routes
router.get(
    "/adminUserManagement",
    adminAuthMiddleware.isAdminAuth,
    adminRender.adminUserManagement
); // Here all listed users can be managed

router.get(
    "/adminUserStaus/:id/:block",
    adminAuthMiddleware.isAdminAuth,
    adminController.adminUserStatus
); // Option to block and unblock user

router.get(
    "/adminUserDelete/:id",
    adminAuthMiddleware.isAdminAuth,
    adminController.adminUserDelete
); // Option to delete users permanently

// Admin Order Management Routes
router.get(
    "/adminOrderManagement",
    adminAuthMiddleware.isAdminAuth,
    adminRender.adminOrderManagement
); // All order are listed and can be managed

router.post(
    "/statusUpdate/:orderId/:productId",
    adminAuthMiddleware.isAdminAuth,
    adminController.statusUpdate
);

router.get(
    "/adminOrderDetails",
    adminAuthMiddleware.isAdminAuth,
    adminRender.adminOrderDetails
);

//Admin Referral offer

router.get(
    "/adminReferralOfferManagement",
    adminAuthMiddleware.isAdminAuth,
    adminRender.adminReferralOfferManagement
);

router
    .route("/addReferralOffer")
    .get(
        adminAuthMiddleware.isAdminAuth,
        adminAuthMiddleware.onlyOneReferal,
        adminRender.addReferralOffer
    )
    .post(
        adminAuthMiddleware.isAdminAuth,
        adminAuthMiddleware.onlyOneReferal,
        referralOfferController.addReferralOffer
    );

router
    .route("/adminUpdateReferralOffer/:referralOfferId")
    .get(adminAuthMiddleware.isAdminAuth, adminRender.updateReferralOffer)
    .put(
        adminAuthMiddleware.isAdminAuth,
        referralOfferController.updateReferralOffer
    );

router.delete(
    "/admintDeleteReferralOffer/:referralOfferId",
    adminAuthMiddleware.isAdminAuth,
    referralOfferController.admintDeleteReferralOffer
);

//Admin coupon management

router.get(
    "/adminCouponManagement",
    adminAuthMiddleware.isAdminAuth,
    adminRender.adminCouponManagement
);

router
    .route("/adminAddCoupon")
    .get(adminAuthMiddleware.isAdminAuth, adminRender.adminAddCoupon)
    .post(adminAuthMiddleware.isAdminAuth, adminCouponController.adminAddCoupon);

router
    .route("/adminUpdateCoupon/:couponId")
    .get(adminAuthMiddleware.isAdminAuth, adminRender.adminUpdateCoupon)
    .put(
        adminAuthMiddleware.isAdminAuth,
        adminCouponController.adminUpdateCoupon
    );

router.delete(
    "/adminDeleteCoupon/:couponId",
    adminAuthMiddleware.isAdminAuth,
    adminCouponController.adminDeleteCoupon
);

// Admin Offer Management

router.get(
    "/adminOfferManagement",
    adminAuthMiddleware.isAdminAuth,
    adminRender.adminOfferManagement
);

router
    .route("/adminAddOffer")
    .get(adminAuthMiddleware.isAdminAuth, adminRender.adminAddOffer)
    .post(adminAuthMiddleware.isAdminAuth, adminOfferController.adminAddOffer);

router
    .route("/adminUpdateOffer/:offerId")
    .get(adminAuthMiddleware.isAdminAuth, adminRender.adminUpdateOffer)
    .put(adminAuthMiddleware.isAdminAuth, adminOfferController.adminUpdateOffer);

router.delete(
    "/adminDeleteOffer/:offerId",
    adminAuthMiddleware.isAdminAuth,
    adminOfferController.adminDeleteOffer
);

router.get(
    "/adminLogout",
    adminAuthMiddleware.isAdminAuth,
    adminController.adminLogout
);

module.exports = router;