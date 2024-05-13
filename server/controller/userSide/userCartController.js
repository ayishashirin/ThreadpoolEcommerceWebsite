const Userdb = require("../../model/userSide/userModel");
const Otpdb = require("../../model/userSide/otpModel");
const Productdb = require("../../model/adminSide/productModel").Productdb;
const ProductVariationdb = require("../../model/adminSide/productModel").ProductVariationdb;
const userVariationdb = require("../../model/userSide/userVariationModel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const mongoose = require("mongoose");
const userHelper = require("../../databaseHelpers/userHelper");
const path = require("path");
const Cartdb = require("../../model/userSide/cartModel");
const usersAddToCart = require("../../services/userSide/userRender");
const saltRounds = 10; // Salt rounds for bcrypt
const orderdb = require("../../model/userSide/orderModel");
const shortid = require("shortid");
const wishlistdb = require("../../model/userSide/wishlist");
const Razorpay = require("razorpay");
const puppeteer = require("puppeteer-core");
const coupondb = require("../../model/adminSide/couponModel");
const instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
});


  // -----------------------------------------------------------------------------------------------------
module.exports = {


  userCartNow: async (req, res) => {
    try {
    


      const isCart = await Cartdb.findOne({
        userId: req.session.isUserAuth,
        "products.productId": req.params.productId,
      });

      if (!isCart) {

        await Cartdb.updateOne(
          { userId: req.session.isUserAuth },
          { $push: { products: { productId: req.params.productId } } },
          { upsert: true }
        );

        return res.status(200).json({success:true})
      } else {
        return res.status(200).redirect("/addToCart")
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({
        err
      })
    }
  },


// --------------------------------------------------------------
 

userCartDelete: async (req, res) => {
    try {
      await Cartdb.updateOne(
        { userId: req.session.isUserAuth },
        { $pull: { products: { productId: req.params.productId } } }
      );

      res.redirect("/addToCart");
    } catch (err) {
      console.error("cart Update err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },


// --------------------------------------------------------------

  userCartDeleteAll: async (req, res) => {
    try {
      await Cartdb.updateOne(
        { userId: req.session.isUserAuth },
        { $set: { products: [] } } // Set the products array to an empty array to remove all items
      );

      res.redirect("/addToCart");
    } catch (err) {
      console.error("Cart update error:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // ----------------------------------------------------------------------------------------------------


  userCartItemUpdate: async (req, res) => {
    try {
      const cartProduct = await Cartdb.findOne(
        {
          userId: req.session.isUserAuth,
          "products.productId": req.params.productId,
        },
        { "products.$": 1 }
      );
      const stock = await ProductVariationdb.findOne(
        { productId: req.params.productId },
        { quantity: 1 }
      );

      const values = parseInt(req.params.values);

      if (values !== 0) {
        if (
          values > 0 &&
          cartProduct.products[0].quantity + values > stock.quantity
        ) {
          return res.json({
            message: `Only ${stock.quantity} stocks available `,
            result: false,
            stock: stock.quantity,
          });
        }

        if (values < 0 && cartProduct.products[0].quantity + values < 1) {
          return res.json({
            message: "Quantity cannot be less than 1",
            result: false,
            stock: stock.quantity,
          });
        }

        const cartItem = await Cartdb.updateOne(
          {
            userId: req.session.isUserAuth,
            "products.productId": req.params.productId,
          },
          { $inc: { "products.$.quantity": values } }
        );
        // User Helper function to get all products in the cart
        const cartItems = await userHelper.getCartItemsAll(
          req.session.isUserAuth
        );
        const discount = cartItems.reduce((total, value) => {
          const fPrice = value.pDetails[0].fPrice;
          const lPrice = value.pDetails[0].lPrice;
          const discountAmount = (fPrice - lPrice) * value.products.quantity;
          return total + discountAmount;
        }, 0);


        
        const total = cartItems.reduce((total, value) => {
          return (total += value.pDetails[0].lPrice * value.products.quantity);
        }, 0);

        return res.json({
          message: "Successful quantity update",
          result: true,
          total,
          discount,
          cartItems: cartItems, // Sending cartItems to frontend
          cartItem,
        });
      }

      return res.json({
        message: "Invalid quantity value",
        result: false,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error", result: false });
    }
  },


// ----------------------------------------------------------------------------------------------------------



userCartCheckOut: async (req, res) => {
  try {
    if (!req.body.adId) {
      req.session.adErr = `Choose an Address`;
    }

    if (!req.body.payMethode) {
      req.session.payErr = `Choose a payment Methode`;
    }

    const address = req.body.adId
      ? await userVariationdb.findOne(
          { userId: req.session.isUserAuth, "address._id": req.body.adId },
          { "address.$": 1, _id: 0 }
        )
      : null;

    if (!address && req.body.adId) {
      req.session.adErr = `Invalid address Choose an Address`;
    }

    if (req.session.payErr || req.session.adErr) {
      if(req.session.isCartItem){
        return res.json({
          url: "/cartCheckOut",
          payMethode: "COD",
          err: true,
        });
      }
      return res.json({
        url: "/cartCheckOut",
        payMethode: "COD",
        err: true,
      });
    }

    if (req.session.isCartItem) {
      //user Helper fn to get product all product in cart
      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);

      let flag = 0;
      cartItems.forEach((element) => {
        if (element.products.quantity > element.variations[0].quantity) {
          flag = 1;
        }
      });

      if (flag === 1) {
        return res.json({
          url: "/addToCart",
          payMethode: "COD",
          err: true,
        });
      }

      //user Helper fn to get coupon
      const coupon  = await userHelper.getCoupon(null, req.session.cartCouponId);

      if(coupon){
        await userHelper.UpdateCouponCount(req.session.cartCouponId);
      }

      const orderItems = cartItems.map((element) => {
        const orderItem = {
          productId: element.products.productId,
          pName: element.pDetails[0].pName,
          category: element.pDetails[0].category,
          pDescription: element.pDetails[0].pDescription,
          quantity: element.products.quantity,
          offerDiscountAmount: Math.round(element.pDetails[0].lPrice * element.products.quandity *  element.allOffers / 100),
          fPrice: element.pDetails[0].fPrice,
          lPrice: element.pDetails[0].lPrice,
          color: element.variations[0].color,
          size: element.variations[0].size,
          images: element.variations[0].images[0],
        };
        if(coupon && ((coupon?.category === 'All') || (coupon?.category === orderItem.category))){
          orderItem.couponDiscountAmount = Math.round(orderItem.fPrice * orderItem.quantity * coupon.discount / 100);
        }else{
          orderItem.couponDiscountAmount = 0;
        }
        return orderItem;
      });

      let tPrice = 0;

      orderItems.forEach(async (element) => {
        await ProductVariationdb.updateOne(
          { productId: element.productId },
          { $inc: { quantity: element.quantity * -1 } }
        );
      });

      orderItems.forEach(async (element) => {
        tPrice += (element.quantity * element.lPrice) - (element.couponDiscountAmount + element.offerDiscountAmount);
      });

      console.log(tPrice,'total amount')

      const newOrder = new orderdb({
        userId: req.session.isUserAuth,
        orderItems: orderItems,
        paymentMethode: req.body.payMethode === "COD" ? "COD" : "razorpay",
        address: address.address[0].structuredAddress,
      });

      if (req.body.paymentMethode === "COD") {
        await newOrder.save();
        await Cartdb.updateOne(
          { userId: req.session.isUserAuth },
          { $set: { products: [] } }
        ); // empty cart items
        req.session.orderSucessPage = true;
        return res.json({
          url: "/userOrderSuccessfull",
          payMethode: "COD",
        });
      }

      if (req.body.paymentMethode === "razorpay") {
        try {
          const options = {
            amount: tPrice * 100,
            currency: "USD",
            receipt: "" + newOrder._id,
          };

          const order = await instance.orders.create(options);

          req.session.newOrder = newOrder;

          return res.json({
            order,
            payMethode: "razorpay",
            keyId: process.env.key_id,
          });
        } catch (err) {
          console.error("rasorpay cart err", err);
          return res.status(500).render("errorPages/500ErrorPage");
        }
      }
    }

    const [ produtDetails ] = await userHelper.getProductDetails(req.session.productId); ///
    const product = await ProductVariationdb.findOne({
      productId: req.session.productId,
    });

    if (product.quantity < orderItem.quantity) {
      req.session.savedQty = orderItem.quantity;
      req.session.avalQty = `Only ${product.quantity} stocks available`;
      return res.json({
        url: `/cartCheckOut}`,
        payMethode: "COD",
        err: true,
      });
    }
console.log("fgfhhjhj:",req.body);
    await ProductVariationdb.updateOne(
      { productId: req.session.productId },
      { $inc: { quantity: Number( orderItem.quantity) * -1 } }
    );

    const newOrder = new orderdb({
      userId: req.session.isUserAuth,
      orderItems: [
        {
          productId: req.session.buyNowPro.pId,
          quantity:  orderItem.quantity,
          pName: produtDetails.pName,
          category: produtDetails.category,
          sTittle: produtDetails.sTittle,
          hDescription: produtDetails.hDescription,
          pDescription: produtDetails.pDescription,
          fPrice: produtDetails.fPrice,
          lPrice: produtDetails.lPrice,
          color: product.color,
          size: product.size,
          offerDiscountAmount: Math.round(produtDetails.lPrice *  orderItem.quantity *  produtDetails.allOffers / 100),
          images: product.images[0],
          fPrice: produtDetails.fPrice,
          lPrice: produtDetails.lPrice,
        },
      ],
      paymentMethode: req.body.paymentMethode === "COD" ? "COD" : "razorpay",
      address: address.address[0].structuredAddress,
    });
    
    if(orderItem.couponId){
      const coupon = await userHelper.getCoupon(null,orderItem.couponId);
      if(coupon && ((coupon.category === 'All') || (coupon.category === newOrder.orderItems[0].category))){
        await userHelper.UpdateCouponCount(orderItem.couponId);
        newOrder.orderItems[0].couponDiscountAmount = (newOrder.orderItems[0].lPrice * newOrder.orderItems[0].quantity * (coupon.discount / 100));
      }
    }

    if (req.body.paymentMethode === "COD") {
      await newOrder.save();
      req.session.orderSuccessPage = true;
      return res.json({
        url: "/userOrderSuccessfull",
        paymentMethode: "COD",
      });
    }

    if (req.body.paymentMethode === "razorpay") {
      try {
        const options = {
          amount:
            (Math.round((newOrder.orderItems[0].lPrice *
            newOrder.orderItems[0].quantity) - (newOrder.orderItems[0].couponDiscountAmount + newOrder.orderItems[0].DiscountAmount)) * 100),
          currency: "USD",
          receipt: "" + newOrder._id,
        };
        const order = await instance.orders.create(options);

        req.session.newOrder = newOrder;

        return res.json({
          order,
          payMethode: "razorpay",
          keyId: process.env.key_id,
        });
      } catch (err) {
        console.error("rasorpay single product err", err);
        res.status(500).render("errorPages/500ErrorPage");
      }
    }
  } catch (err) {
    console.error("payment whole errr", err);
    res.status(500).render("errorPages/500ErrorPage");
  }
},

//   ----------------------------------------------------------------------------------------------------------

isCouponValidCart: async (req, res) => {
    try {
      const coupon = await userHelper.getCoupon(req.body.code);

      if(!coupon){
        return res.status(401).json({
          err: true,
          reload: false,
          message: 'Invalid coupon code'
        });
      }

      if(new Date(coupon.expiry) < new Date()){
        return res.status(401).json({
          err: true,
          reload: false,
          message: 'Coupon expired'
        });
      }

      if(coupon.count <= 0){
        return res.status(401).json({
          err: true,
          reload: false,
          message: `This coupon is Expired`
        });
      }

      //user Helper fn to get product all product in cart
      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
      let minPriceErr = false;  
      const total = cartItems.reduce((total, value) => {
        return total += Math.round((value.pDetails[0].fPrice * value.products.quantity));
    }, 0);
      
      const totalDiscount = cartItems.reduce((total, value, i) => {
        if(((value.pDetails[0].category === coupon.category) || (coupon.category === 'All')) && (total >= coupon.minPrice)){
          return total += Math.round((total * coupon.discount) / 100);
        }

        if((total < coupon.minPrice)){
          minPriceErr = true;
        }

        return total;
      }, 0);

      // if(!totalDiscount && minPriceErr){
      //   return res.status(401).json({
      //     err: true,
      //     reload: false,
      //     message: `This coupon is for products greater than or equal to ₹${coupon.minPrice}`
      //   });
      // }

      // if(!totalDiscount){
      //   return res.status(401).json({
      //     err: true,
      //     reload: false,
      //     message: `This coupon is for ${coupon.category} category`
      //   });
      // }

   console.log(totalDiscount);
   console.log(coupon);
   console.log(total);

      res.status(200).json({
        status: true,
        message: `Coupon code ${coupon.code} applied successfully!`,
        totalDiscount,
        coupon,
        minPriceErr,
        total
      });
    } catch (err) {
      console.error("isCoupon cart err", err);
      res.status(500).json({
        err: true,
        reload: true,
        message:"errorPages/500ErrorPage"
      });
    }
  },

// -------------------------------------------------------------------------------------------------------------------------------
 



}                      