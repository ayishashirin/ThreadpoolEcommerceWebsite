const adminHelper = require('../../databaseHelpers/adminHelper')
const path = require('path');
const Orderdb = require('../../model/userSide/orderModel');
const { Productdb } = require('../../model/adminSide/productModel');
const Userdb = require('../../model/userSide/userModel');
const offerdb = require('../../model/adminSide/offerModel');



module.exports = {
  adminLogin: (req, res) => {
    const test = path.join(__dirname);
    console.log(test);
    res.render(
      "adminSide/adminLogin",
      { invalid: req.session.invalidAdmin, adminErr:{
        adminEmail: req.session.adminEmail,
        adminPassword: req.session.adminPassword
      } },
      (err, html) => {
        if (err) {
          console.error("Error rendering view:", err);
          return res.status(500).send("Internal Server Error");
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
     

      res.status(200).render("adminSide/adminDashboard");
    } catch (err) {
      console.log("err", err);
      res.send("Internal server err");
    }
  },
  adminAddProducts: async (req, res) => {
    try {
      //adminHelper fn to get listed category
      const category = await adminHelper.getCategorydb(null, true, 1, true);

      let productInfo = req.flash('userProductFormData');
      let errMesg = req.flash('userProductErrors');




      if(productInfo){
        productInfo = productInfo[0];
      }

      if(errMesg){
        errMesg = errMesg[0];
      }

      
      

          res.status(200).render(
        "adminSide/adminAddProduct",
        {
          savedDetails: productInfo,
          errMesg,
          category, 
          savedDetails: req.session.productInfo,
    
        },

        
      
        

        (err, html) => {
          if (err) {
            console.log("Register Page render Err:", err);
            return res.status(500).send("Internal Error");
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
      //adminHelper fn to get all listed product
      const products = await adminHelper.getProductList(false, req.query.page);

      //adminHelper fn to get total listed products
      const totalProducts = await adminHelper.adminPageNation('PM', false);

      res.status(200).render(
        "adminSide/adminProductManagement",
        {
          products,
          totalProducts,
          currentPage: Number(req.query.page),
          filter: req.query.Search
        },
        (err, html) => {
          if (err) {
            return res.status(500).send("Internal Server Error");
          }

          delete req.session.productInfo;

          res.send(html);
        }
      );
    } catch (err) {
      console.log("err", err);
      res.send("Internal server err");
    }
  },
  adminAddCategory: (req, res) => {
    res
      .status(200)
      .render(
        "adminSide/adminAddCategory",
        { 
          errMesg:{
            catErr: req.session.catErr,
            dErr: req.session.dErr,
          },
          sDetails: req.session.sDetails
        },
        (err, html) => {
          if (err) {
            console.log("render Err", err);
            return res.status(500).send("Internal Server err");
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
      const category = await adminHelper.getCategorydb(req.query.Search, true, req.query.page);


      //adminHelper fn to get total number of liseted category
      const totalCategory = await adminHelper.adminPageNation('CM', true);

      res.render("adminSide/adminCategoryManagement"
      , {
        category,
        filterCat: req.query.Search,
        currentPage: Number(req.query.page),
        totalCategory
      });
    } catch (err) {
      console.log("err", err);
      res.send("Internal server err");
    }
  },
  adminUnlistedCategory: async (req, res) => {
    try {
      //adminHelper fn to get all unlisted category
      const category = await adminHelper.getCategorydb(req.query.Search, false, req.query.page);

      //adminHelper fn to get all unlisted category count
      const totalCategory = await adminHelper.adminPageNation('CM', false);

      res
        .status(200)
        .render("adminSide/adminUnlistedCategory", { filterCat: req.query.Search, category, currentPage: Number(req.query.page), totalCategory});
    } catch (err) {
      console.log("err", err);
      res.send("Internal server err");
    }
  },
  adminUnlistedProduct: async (req, res) => {
    try {

      //adminHelper fn to get all unlised product
      const products = await adminHelper.getProductList(true, req.query.page);

      //adminHelper fn to get total listed products
      const totalProducts = await adminHelper.adminPageNation('PM', true);

      res.status(200).render("adminSide/adminUnlistedProduct", {
        products,
        totalProducts,
        currentPage: Number(req.query.page),
        filter: req.query.Search
      });
    } catch (err) {
      console.log("err", err);
      res.send("Internal server err");
    }
  },
  adminUpdateProduct: async (req, res) => {
    try {
      //adminHelper fn to get listed category
      const category = await adminHelper.getCategorydb(null, true, 1, true);

      //adminHelper fn to get single product details for updating
      const [ product ] = await adminHelper.adminGetSingleProduct(req.params.id);


      let updateProductInfo = req.flash('userUpdateProductFormData');
      let errMesg = req.flash('userUpdateProductErrors');


      if(updateProductInfo){
        updateProductInfo = updateProductInfo[0];
      }

      if(errMesg){
        errMesg = errMesg[0];
      }


      res.status(200).render(
        "adminSide/adminUpdateProduct",
        {
          savedDetails: updateProductInfo,
          errMesg,
          category, 
          savedDetails: req.session.updateProductInfo,product
    
        },
        (err, html) => {
          if (err) {
            console.error("Error rendering view:", err);
            return res.status(500).send("Internal Server Error");
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
      res.send("Internal server err");
    }
  },
  adminUserManagement: async(req, res) => {
    //Admin Helper fn to get all users details
    const users = await adminHelper.adminGetAllUsers(req.query.Search, req.query.page);

    //Admin Helper fn to get total numbers
    const totalUsers = await adminHelper.adminPageNation('UM');

    res.status(200).render('adminSide/adminUserManagement', {users, filter: req.query.Search, currentPage: Number(req.query.page), totalUsers});
  },
  
  updateCategory: async (req, res) => {
    try {
      //adminHelper fn to get all details of single category
      const singleCategory = await adminHelper.getCategorydb(null, true, null, true, req.params.categoryId);

      res.status(200).render('adminSide/adminUpdateCategory', {
        singleCategory,
        errMesg:{
          catErr: req.session.catErr,
          dErr: req.session.dErr,
        },
        sDetails: req.session.sDetails
      }, (err, html) => {
        if(err){
          console.error('Update render err categorg', err);
          return res.status(500).send('Internal server err');
        }

        delete req.session.catErr;
        delete req.session.dErr;
        delete req.session.sDetails;

        res.status(200).send(html);
      });
    } catch (err) {
      console.error('updatePage get errr', err);
      res.status(500).send('Internal server err');
    }
  },
 
  adminOrderManagement: async (req, res) => {
    try {
      const orders = await adminHelper.getAllOrders(req.query.filter, req.query.page);
      console.log("orders:",orders);
      //adminHelper fn to get total number of orders
      const orderLength = await adminHelper.adminPageNation('OM'); // OM for orders management
      
      res.status(200).render("adminSide/adminOrderManagement", {orders, filter: req.query.filter, currentPage: Number(req.query.page), orderLength});
    } catch (err) {
      console.log("err", err);
      res.send("Internal server err");
    }
  },
  adminReferralOfferManagement: async (req, res) => {
    try {
      //adminHelper fn to get all referral offer
      const referralOffers = await adminHelper.referralOffers();

      res.status(200).render('adminSide/adminReferralOfferManagement', {referralOffers, referralErr: req.flash('referralErr')});
    } catch (err) {
      console.error('updatePage get errr', err);
      res.status(500).send('Internal server err');
    }
  },
  addReferralOffer: async (req, res) => {
    try {
      res.status(200).render('adminSide/adminAddReferralOffer', {sDetails: req.session.sDetails, errMesg: {
        expiry: req.session.expiry,
        discription: req.session.discription,
        referralRewards: req.session.referralRewards,
        referredUserRewards: req.session.referredUserRewards,
      }}, (err, html) => {
        if(err){
          console.error('Add referral offer', err);
          return res.status(500).send('Internal Server Err');
        }

        delete req.session.expiry;
        delete req.session.discription;
        delete req.session.referralRewards;
        delete req.session.referredUserRewards;
        delete req.session.sDetails;

        res.status(200).send(html);
      });
    } catch (err) {
      console.error('updatePage get errr', err);
      res.status(500).send('Internal server err');
    }
  },
  updateReferralOffer: async (req, res) => {
    try {
      //AdminHelper fn to get a single referral details to update
      const singleReferralOffer = await adminHelper.referralOffers(req.params.referralOfferId);

      res.status(200).render('adminSide/adminUpdateReferralOffer', {singleReferralOffer, sDetails: req.session.sDetails, errMesg: {
        expiry: req.session.expiry,
        discription: req.session.discription,
        referralRewards: req.session.referralRewards,
        referredUserRewards: req.session.referredUserRewards,
      }}, (err, html) => {
        if(err){
          console.error('Add referral offer', err);
          return res.status(500).send('Internal Server Err');
        }

        delete req.session.expiry;
        delete req.session.discription;
        delete req.session.referralRewards;
        delete req.session.referredUserRewards;
        delete req.session.sDetails;

        res.status(200).send(html);
      });
    } catch (err) {
      console.error('updatePage get errr', err);
      res.status(500).send('Internal server err');
    }
  },


  adminOrderDetails: async (req, res) => {
    try {
      const product = await adminHelper.getSingleOrder(req.query.id)
      const order = await Orderdb.findOne()
      const orders = await adminHelper.getSingleOrder({_id:req.query.id})
      const userInfo = await Userdb.findOne()
      const offerDetails = await offerdb.findOne({})
      const totalPrice = order.orderItems.reduce((total, item) => total + (item.fPrice * item.quantity), 0);
      const totalDiscountAmount = order.orderItems.reduce((total, item) => total + item.DiscountAmount, 0);
     
console.log("product:",product);
console.log("order:",order);
console.log("offerDetails:",offerDetails);
console.log("totalPrice:",totalPrice);
console.log("totalDiscountAmount:",totalDiscountAmount);



      
   
      res.status(200).render('adminSide/adminOrderDetails',{product:product[0], order:order,userInfo,totalPrice,orders,totalDiscountAmount,offerDetails,})
      
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  },


  adminCouponManagement: async (req, res) => {
    try {
      const totalCoupons = await adminHelper.adminPageNation('CouponM');
      const coupons = await adminHelper.getAllCoupon(null, req.query.page);
      
      res.status(200).render('adminSide/adminCouponManagement', { coupons, totalCoupons, currentPage: Number(req.query.page) });
    } catch (err) {
      console.error('updatePage get errr', err);
      res.status(500).send('Internal server err');
    }
  },
  adminAddCoupon: async (req, res) => {
    try {
      const category = await adminHelper.getCategorydb(null, true, 1, true);

      res.status(200).render('adminSide/adminAddCoupon', {
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
        savedDetails: req.session.savedDetails
      }, (err, html) => {
        if(err){
          console.error('Add Coupon render err', err);
          return res.status(500).send('Internal server err');
        }
        delete req.session.userId,
        delete req.session.code;
        delete req.session.category;
        delete req.session.discount;
        delete req.session.count;
        delete req.session.minPrice;
        delete req.session.expiry;
        delete req.session.savedDetails;

        res.status(200).send(html);
      });
    } catch (err) {
      console.error('updatePage get errr', err);
      res.status(500).send('Internal server err');
    }
  },
  adminUpdateCoupon: async (req, res) => {
    try {
      //adminHelper fn to get single coupon details
      const singleCoupon = await adminHelper.getAllCoupon(req.params.couponId);

      //adminHelper fn to get all category for select
      const category = await adminHelper.getCategorydb(null, true, 1, true);
      if(!singleCoupon){
        return res.status(401).redirect('/adminCouponManagement');
      }
      res.status(200).render('adminSide/adminUpdateCoupon',{ savedDetails: req.session.savedDetails, 
        errMesg: {
          userId: req.session.userId,
          code: req.session.code,
          category: req.session.category,
          discount: req.session.discount,
          count: req.session.count,
          minPrice: req.session.minPrice,
          expiry: req.session.expiry,
        }, singleCoupon, category },(err, html) => {
          if(err){
            console.error('Add Coupon render err', err);
            return res.status(500).send('Internal server err');
          }
          delete req.session.userId,
          delete req.session.code;
          delete req.session.category;
          delete req.session.discount;
          delete req.session.count;
          delete req.session.minPrice;
          delete req.session.expiry;
          delete req.session.savedDetails;
  
          res.status(200).send(html);
        });
    } catch (err) {
      console.error('updatePage get errr', err);
      res.status(500).send('Internal server err');
    }
  },
  adminOfferManagement: async (req, res) => {
    try {
      //adminHeleper fn to get offers
      const offers = await adminHelper.getOffer(null, req.query.page);
      const totalOffers = await adminHelper.adminPageNation('OfferM');

      res.status(200).render('adminSide/adminOfferManagement', { offers, totalOffers, currentPage: Number(req.query.page) });
    } catch (err) {
      console.error('updatePage get errr', err);
      res.status(500).send('Internal server err');
    }
  },
  adminAddOffer: async (req, res) => {
    try {
      const category = await adminHelper.getCategorydb(null, true, 1, true);

      res.status(200).render('adminSide/adminAddOffer',{ 
        category,
        savedDetails: req.session.savedDetails, 
        errMesg: {
          productName: req.session.productName,
          category: req.session.category,
          discount: req.session.discount,
          expiry: req.session.expiry,
        }
      }, (err, html) => {
        if(err){
          console.error('add offer render err', err);
          return res.status(500).send('Internal server err');
        }

        delete req.session.savedDetails;
        delete req.session.productName;
        delete req.session.category;
        delete req.session.discount;
        delete req.session.expiry;

        res.status(200).send(html);
      });
    } catch (err) {
      console.error('add offer errr', err);
      res.status(500).send('Internal server err');
    }
  },
  adminUpdateOffer: async (req, res) => {
    try {
      const category = await adminHelper.getCategorydb(null, true, 1, true);

      const offer = await adminHelper.getOffer(req.params.offerId);

      if(!offer){
        return res.status(401).redirect('/adminOfferManagement');
      }

      res.status(200).render('adminSide/adminUpdateOffer', { 
        category,
        offer,
        savedDetails: req.session.savedDetails, 
        errMesg: {
          productName: req.session.productName,
          category: req.session.category,
          discount: req.session.discount,
          expiry: req.session.expiry,
        }
       }, (err, html) => {
        if(err){
          console.error('update offer render err', err);
          return res.status(500).send('Internal server err');
        }

        delete req.session.savedDetails;
        delete req.session.productName;
        delete req.session.category;
        delete req.session.discount;
        delete req.session.expiry;

        res.status(200).send(html);
      });
    } catch (err) {
      console.error('updatePage offer errr', err);
      res.status(500).send('Internal server err');
    }
  },


 
}