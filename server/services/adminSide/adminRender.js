const adminHelper = require("../../databaseHelpers/adminHelper");
const path = require("path");
const Orderdb = require("../../model/userSide/orderModel");
const { Productdb, ProductVariationdb } = require("../../model/adminSide/productModel");
const Userdb = require("../../model/userSide/userModel");
const userVariationdb = require("../../model/userSide/userVariationModel");
const Categorydb = require('../../model/adminSide/category').Categorydb;


module.exports = {
  adminLogin: (req, res) => {
    const test = path.join(__dirname);
    res.render(
      "adminSide/adminLogin",
      {
        invalid: req.session.invalidAdmin,
        adminErr: {
          adminEmail: req.session.adminEmail,
          adminPassword: req.session.adminPassword,
        },
      },
      (err, html) => {
        if (err) {
          console.error("Error rendering view:", err);
          return res.status(500).render("errorPages/500ErrorPage");
        }

        delete req.session.invalidAdmin;
        delete req.session.adminPassword;
        delete req.session.adminEmail;

        res.send(html);
      }
    );
  },
  adminHome: async (req, res) => {
    try {
      const details = await adminHelper.getAllDashCount();
      const orders = await adminHelper.getAllOrders(req.query.filter, req.query.page);
      const order = await Orderdb.find();

      const productCount = {};
      order.forEach(orders => {
        orders.orderItems.forEach(item => {
          const productId = item.productId.toString();
          if (productCount[productId]) {
            productCount[productId]++;
          } else {
            productCount[productId] = 1;
          }
        });
      });

      const productCountArray = Object.entries(productCount);
      productCountArray.sort((a, b) => b[1] - a[1]);
      const top10ProductCounts = productCountArray.slice(0, 4).map(first => first[0]);

      const matchingProduct = [];
      for (const productId of top10ProductCounts) {
        const product = await ProductVariationdb.findOne({ productId: productId }).populate('productId');
        matchingProduct.push(product);
      }

      const categoryCount = {};
      order.forEach(orders => {
        orders.orderItems.forEach(item => {
          const category = item.category;
          if (categoryCount[category]) {
            categoryCount[category]++;
          } else {
            categoryCount[category] = 1;
          }
        });
      });

      const categoryCountArray = Object.entries(categoryCount);
      categoryCountArray.sort((a, b) => b[1] - a[1]);
      const top2CategoryCounts = categoryCountArray.slice(0, 2).map(entry => entry[0]);

      const matchingCategories = [];
      for (const categoryName of top2CategoryCounts) {
        const category = await Categorydb.findOne({ name: categoryName });
        matchingCategories.push(category);
      }

      res.status(200).render("adminSide/adminDashboard", {
        details,
        orders,
        doc: matchingProduct,
        categories: matchingCategories
      });
    } catch (err) {
      console.log("err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },


  adminAddProducts: async (req, res) => {
    try {
      const category = await adminHelper.getCategorydb(null, true, 1, true);
      let productInfo = req.flash("userProductFormData");
      let errMesg = req.flash("userProductErrors");
      if (productInfo) {
        productInfo = productInfo[0];
      }

      if (errMesg) {
        errMesg = errMesg[0];
      }
      res.status(200).render(
        "adminSide/adminAddProduct",
        {
          productInfo,
          errMesg,
          category,
          savedDetails: req.session.productInfo,
        },

        (err, html) => {
          if (err) {
            console.log("Register Page render Err:", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }
          delete req.session.pName;
          delete req.session.pDescription;
          delete req.session.fPrice;
          delete req.session.lPrice;
          delete req.session.discount;
          delete req.session.color;
          delete req.session.size;
          delete req.session.quantity;
          delete req.session.files;
          delete req.session.productInfo;

          res.status(200).send(html);
        }
      );
    } catch (err) {
      console.log(err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  adminProductManagement: async (req, res) => {
    try {
      const products = await adminHelper.getProductList(false, req.query.page);

      //adminHelper fn to get total listed products
      const totalProducts = await adminHelper.adminPageNation("PM", false);

      res.status(200).render(
        "adminSide/adminProductManagement",
        {
          products,
          totalProducts,
          currentPage: Number(req.query.page),
          filter: req.query.Search,
        },
        (err, html) => {
          if (err) {
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.productInfo;

          res.send(html);
        }
      );
    } catch (err) {
      console.log("err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  adminAddCategory: (req, res) => {
    res.status(200).render(
      "adminSide/adminAddCategory",
      {
        errMesg: {
          catErr: req.session.catErr,
          dErr: req.session.dErr,
        },
        sDetails: req.session.sDetails,
      },
      (err, html) => {
        if (err) {
          console.log("render Err", err);
          return res.status(500).render("errorPages/500ErrorPage");
        }

        delete req.session.catErr;
        delete req.session.dErr;
        delete req.session.sDetails;

        res.send(html);
      }
    );
  },
  adminCategoryManagement: async (req, res) => {
    try {
      //adminHelper fn to get all listed category
      const category = await adminHelper.getCategorydb(
        req.query.Search,
        true,
        req.query.page
      );

      //adminHelper fn to get total number of liseted category
      const totalCategory = await adminHelper.adminPageNation("CM", true);

      res.render("adminSide/adminCategoryManagement", {
        category,
        filterCat: req.query.Search,
        currentPage: Number(req.query.page),
        totalCategory,
      });
    } catch (err) {
      console.log("err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  adminUnlistedCategory: async (req, res) => {
    try {
      //adminHelper fn to get all unlisted category
      const category = await adminHelper.getCategorydb(
        req.query.Search,
        false,
        req.query.page
      );

      //adminHelper fn to get all unlisted category count
      const totalCategory = await adminHelper.adminPageNation("CM", false);

      res
        .status(200)
        .render("adminSide/adminUnlistedCategory", {
          filterCat: req.query.Search,
          category,
          currentPage: Number(req.query.page),
          totalCategory,
        });
    } catch (err) {
      console.log("err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  adminUnlistedProduct: async (req, res) => {
    try {
      //adminHelper fn to get all unlised product
      const products = await adminHelper.getProductList(true, req.query.page);

      //adminHelper fn to get total listed products
      const totalProducts = await adminHelper.adminPageNation("PM", true);

      res.status(200).render("adminSide/adminUnlistedProduct", {
        products,
        totalProducts,
        currentPage: Number(req.query.page),
        filter: req.query.Search,
      });
    } catch (err) {
      console.log("err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  adminUpdateProduct: async (req, res) => {
    try {
      //adminHelper fn to get listed category
      const category = await adminHelper.getCategorydb(null, true, 1, true);

      //adminHelper fn to get single product details for updating
      const [product] = await adminHelper.adminGetSingleProduct(req.params.id);

      let updateProductInfo = req.flash("userUpdateProductFormData");
      let errMesg = req.flash("userUpdateProductErrors");

      if (updateProductInfo) {
        updateProductInfo = updateProductInfo[0];
      }

      if (errMesg) {
        errMesg = errMesg[0];
      }

      res.status(200).render(
        "adminSide/adminUpdateProduct",
        {
          savedDetails: updateProductInfo,
          errMesg,
          category,
          savedDetails: req.session.updateProductInfo,
          product,
        },
        (err, html) => {
          if (err) {
            console.error("Error rendering view:", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.pName;
          delete req.session.pDescription;
          delete req.session.fPrice;
          delete req.session.lPrice;
          delete req.session.discount;
          delete req.session.color;
          delete req.session.size;
          delete req.session.quantity;
          delete req.session.files;
          delete req.session.updateProductInfo;

          res.send(html);
        }
      );
    } catch (err) {
      console.log("err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  adminUserManagement: async (req, res) => {
    //Admin Helper fn to get all users details
    const users = await adminHelper.adminGetAllUsers(
      req.query.Search,
      req.query.page
    );

    //Admin Helper fn to get total numbers
    const totalUsers = await adminHelper.adminPageNation("UM");

    res
      .status(200)
      .render("adminSide/adminUserManagement", {
        users,
        filter: req.query.Search,
        currentPage: Number(req.query.page),
        totalUsers,
      });
  },

  updateCategory: async (req, res) => {
    try {
      //adminHelper fn to get all details of single category
      const singleCategory = await adminHelper.getCategorydb(
        null,
        true,
        null,
        true,
        req.params.categoryId
      );

      res.status(200).render(
        "adminSide/adminUpdateCategory",
        {
          singleCategory,
          errMesg: {
            catErr: req.session.catErr,
            dErr: req.session.dErr,
          },
          sDetails: req.session.sDetails,
        },
        (err, html) => {
          if (err) {
            console.error("Update render err categorg", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.catErr;
          delete req.session.dErr;
          delete req.session.sDetails;

          res.status(200).send(html);
        }
      );
    } catch (err) {
      console.error("updatePage get errr", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  adminOrderManagement: async (req, res) => {
    try {
      const orders = await adminHelper.getAllOrders(
        req.query.filter,
        req.query.page
      );
      //adminHelper fn to get total number of orders
      const orderLength = await adminHelper.adminPageNation("OM"); 
      res
        .status(200)
        .render("adminSide/adminOrderManagement", {
          orders,
          filter: req.query.filter,
          currentPage: Number(req.query.page),
          orderLength,
        });
    } catch (err) {
      console.log("err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  adminReferralOfferManagement: async (req, res) => {
    try {
      //adminHelper fn to get all referral offer
      const referralOffers = await adminHelper.referralOffers();

      res
        .status(200)
        .render("adminSide/adminReferralOfferManagement", {
          referralOffers,
          referralErr: req.flash("referralErr"),
        });
    } catch (err) {
      console.error("updatePage get errr", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  addReferralOffer: async (req, res) => {
    try {
      res.status(200).render(
        "adminSide/adminAddReferralOffer",
        {
          sDetails: req.session.sDetails,
          errMesg: {
            expiry: req.session.expiry,
            discription: req.session.discription,
            referralRewards: req.session.referralRewards,
            referredUserRewards: req.session.referredUserRewards,
          },
        },
        (err, html) => {
          if (err) {
            console.error("Add referral offer", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.expiry;
          delete req.session.discription;
          delete req.session.referralRewards;
          delete req.session.referredUserRewards;
          delete req.session.sDetails;

          res.status(200).send(html);
        }
      );
    } catch (err) {
      console.error("updatePage get errr", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  updateReferralOffer: async (req, res) => {
    try {
      //AdminHelper fn to get a single referral details to update
      const singleReferralOffer = await adminHelper.referralOffers(
        req.params.referralOfferId
      );

      res.status(200).render(
        "adminSide/adminUpdateReferralOffer",
        {
          singleReferralOffer,
          sDetails: req.session.sDetails,
          errMesg: {
            expiry: req.session.expiry,
            discription: req.session.discription,
            referralRewards: req.session.referralRewards,
            referredUserRewards: req.session.referredUserRewards,
          },
        },
        (err, html) => {
          if (err) {
            console.error("Add referral offer", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.expiry;
          delete req.session.discription;
          delete req.session.referralRewards;
          delete req.session.referredUserRewards;
          delete req.session.sDetails;

          res.status(200).send(html);
        }
      );
    } catch (err) {
      console.error("updatePage get errr", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  adminOrderDetails: async (req, res) => {
    try {
      const orders = await Orderdb.findOne({ _id: req.query.id });

      const userInfo = await Userdb.findOne();

      const totalPrice = orders?.orderItems.reduce(
        (total, item) => total + item.fPrice * item.quantity,
        0
      );

      // const totalDiscountAmount = orders?.orderItems.reduce((total, item) => total + item.DiscountAmount, 0);

      res
        .status(200)
        .render("adminSide/adminOrderDetails", {
          userInfo,
          totalPrice,
          orders,
        });
    } catch (error) {
      console.error(error);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  adminCouponManagement: async (req, res) => {
    try {
      const totalCoupons = await adminHelper.adminPageNation("CouponM");
      const coupons = await adminHelper.getAllCoupon(null, req.query.page);

      res
        .status(200)
        .render("adminSide/adminCouponManagement", {
          coupons,
          totalCoupons,
          currentPage: Number(req.query.page),
        });
    } catch (err) {
      console.error("updatePage get errr", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  adminAddCoupon: async (req, res) => {
    try {
      const category = await adminHelper.getCategorydb(null, true, 1, true);

      res.status(200).render(
        "adminSide/adminAddCoupon",
        {
          category,
          errMesg: {
            userId: req.session.userId,
            code: req.session.code,
            category: req.session.category,
            discount: req.session.discount,
            count: req.session.count,
            minPrice: req.session.minPrice,
            expiry: req.session.expiry,
          },
          savedDetails: req.session.savedDetails,
        },
        (err, html) => {
          if (err) {
            console.error("Add Coupon render err", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }
          delete req.session.userId, delete req.session.code;
          delete req.session.category;
          delete req.session.discount;
          delete req.session.count;
          delete req.session.minPrice;
          delete req.session.expiry;
          delete req.session.savedDetails;

          res.status(200).send(html);
        }
      );
    } catch (err) {
      console.error("updatePage get errr", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  adminUpdateCoupon: async (req, res) => {
    try {
      //adminHelper fn to get single coupon details
      const singleCoupon = await adminHelper.getAllCoupon(req.params.couponId);

      //adminHelper fn to get all category for select
      const category = await adminHelper.getCategorydb(null, true, 1, true);
      if (!singleCoupon) {
        return res.status(401).redirect("/adminCouponManagement");
      }
      res.status(200).render(
        "adminSide/adminUpdateCoupon",
        {
          savedDetails: req.session.savedDetails,
          errMesg: {
            userId: req.session.userId,
            code: req.session.code,
            category: req.session.category,
            discount: req.session.discount,
            count: req.session.count,
            minPrice: req.session.minPrice,
            expiry: req.session.expiry,
          },
          singleCoupon,
          category,
        },
        (err, html) => {
          if (err) {
            console.error("Add Coupon render err", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }
          delete req.session.userId, delete req.session.code;
          delete req.session.category;
          delete req.session.discount;
          delete req.session.count;
          delete req.session.minPrice;
          delete req.session.expiry;
          delete req.session.savedDetails;

          res.status(200).send(html);
        }
      );
    } catch (err) {
      console.error("updatePage get errr", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  adminOfferManagement: async (req, res) => {
    try {
      //adminHeleper fn to get offers
      const offers = await adminHelper.getOffer(null, req.query.page);
      const totalOffers = await adminHelper.adminPageNation("OfferM");

      res
        .status(200)
        .render("adminSide/adminOfferManagement", {
          offers,
          totalOffers,
          currentPage: Number(req.query.page),
        });
    } catch (err) {
      console.error("updatePage get errr", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  adminAddOffer: async (req, res) => {
    try {
      const category = await adminHelper.getCategorydb(null, true, 1, true);

      res.status(200).render(
        "adminSide/adminAddOffer",
        {
          category,
          savedDetails: req.session.savedDetails,
          errMesg: {
            productName: req.session.productName,
            category: req.session.category,
            discount: req.session.discount,
            expiry: req.session.expiry,
          },
        },
        (err, html) => {
          if (err) {
            console.error("add offer render err", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.savedDetails;
          delete req.session.productName;
          delete req.session.category;
          delete req.session.discount;
          delete req.session.expiry;

          res.status(200).send(html);
        }
      );
    } catch (err) {
      console.error("add offer errr", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  adminUpdateOffer: async (req, res) => {
    try {
      const category = await adminHelper.getCategorydb(null, true, 1, true);

      const offer = await adminHelper.getOffer(req.params.offerId);

      if (!offer) {
        return res.status(401).redirect("/adminOfferManagement");
      }

      res.status(200).render(
        "adminSide/adminUpdateOffer",
        {
          category,
          offer,
          savedDetails: req.session.savedDetails,
          errMesg: {
            productName: req.session.productName,
            category: req.session.category,
            discount: req.session.discount,
            expiry: req.session.expiry,
          },
        },
        (err, html) => {
          if (err) {
            console.error("update offer render err", err);
            return res.status(500).render("errorPages/500ErrorPage");
          }

          delete req.session.savedDetails;
          delete req.session.productName;
          delete req.session.category;
          delete req.session.discount;
          delete req.session.expiry;

          res.status(200).send(html);
        }
      );
    } catch (err) {
      console.error("updatePage offer errr", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  getSalesReportfilter: async (req, res) => {
    try {
      const { reportType, filter } = req.query; rs
      const reportTypes = [
        "All",
        "Today",
        "Last Week",
        "Last Month",
        "This Year",
      ];
      let currentType = reportType;
      let startDate;
      let endDate = new Date();

      if (!reportType || reportType === "Today") {
        const today = new Date();
        startDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        endDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1
        );
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        currentType = "Today";
      } else if (reportType === "Last Week") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (reportType === "Last Month") {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (reportType === "This Year") {
        startDate = new Date(new Date().getFullYear(), 0, 1);
        endDate = new Date(new Date().getFullYear(), 11, 31);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (filter) {
        switch (filter) {
          case "Yearly":
            startDate = new Date(
              new Date().setFullYear(new Date().getFullYear() - 1)
            );
            break;
          case "Monthly":
            startDate = new Date(
              new Date().setMonth(new Date().getMonth() - 1)
            );
            break;
          case "Weekly":
            startDate = new Date(new Date().setDate(new Date().getDate() - 7));
            break;
          case "Daily":
            startDate = new Date(new Date().setDate(new Date().getDate() - 1));
            break;
          default:
            startDate = new Date();
        }
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }

      let salesData;

      if (reportType === "All") {
        salesData = await Orderdb.aggregate([
          { $unwind: "$orderItems" },
          {
            $match: {
              "orderItems.status": { $nin: ["Cancelled", "Returned"] },
            },
          },
          {
            $lookup: {
              from: "productdbs",
              localField: "orderItems.productId",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          { $unwind: "$productDetails" },
          { $sort: { orderDate: -1 } },
        ]);
      } else {
        salesData = await Orderdb.aggregate([
          {
            $match: {
              orderDate: { $gte: startDate, $lte: endDate },
            },
          },
          { $unwind: "$orderItems" },
          {
            $match: {
              "orderItems.orderStatus": { $nin: ["Cancelled", "Returned"] },
            },
          },
          {
            $lookup: {
              from: "productdbs",
              localField: "orderItems.productId",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          { $unwind: "$productDetails" },
          { $sort: { orderDate: -1 } },
        ]);
      }

      res
        .status(200)
        .render("adminSide/salesReport", {
          sales: salesData,
          currentType,
          reportTypes,
          reportType,
          startDate,
          endDate,
        });
    } catch (error) {
      console.log("Error:", error);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  getCustomChart: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const findQuery = {
        orderDate: {
          $gte: start,
          $lte: end,
        },
      };

      const orders = await Orderdb.find(findQuery);

      let labels = [];
      let salesCount = [];

      orders.forEach((order) => {
        const date = order.orderDate.toISOString().split('T')[0];
        const index = labels.indexOf(date);
        if (index === -1) {
          labels.push(date);
          salesCount.push(1);
        } else {
          salesCount[index] += 1;
        }
      });

      res.json({ labels, salesCount });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal server error");
    }
  },


};
