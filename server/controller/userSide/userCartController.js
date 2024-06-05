const ProductVariationdb = require("../../model/adminSide/productModel").ProductVariationdb;
const userVariationdb = require("../../model/userSide/userVariationModel");
const userHelper = require("../../databaseHelpers/userHelper");
const Cartdb = require("../../model/userSide/cartModel");
const orderdb = require("../../model/userSide/orderModel");
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require("uuid");
const instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

const UserWalletdb = require('../../model/userSide/walletModel');
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
  
        return res.status(200).redirect("/addToCart" );
      } else {
        return res.status(200).json({
          success: false,
          message: "Product already exists in cart"
        });
      }
    } catch (err) {
      console.error(err,"rerre");
      res.status(500).json({
        success: false,
        err,
      });
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

        if (values > 0  &&
          cartProduct.products[0].quantity + values > 10) {
          return res.json({
            message: "Quantity cannot be greater than 10",
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
      const { paymentMethode, adId, coupon, offerPrice } = req.body;

  
      // Validate payment method
      if (!paymentMethode) {
        req.session.payErr = "Choose a payment Methode";
      }
  
      // Validate address
      if (!adId) {
        req.session.adErr = "Choose an Address";
      }
  
      // Retrieve address details
      const address = adId
        ? await userVariationdb.findOne(
            { userId: req.session.isUserAuth, "address._id": adId },
            { "address.$": 1, _id: 0 }
          )
        : null;
  
      if (!address) {
        req.session.adErr = "Invalid address. Choose an Address";
      }
  
      // If there are errors, respond with the appropriate URL and error flag
      if (req.session.payErr || req.session.adErr) {
        return res.json({
          url: "/cartCheckOut",
          paymentMethode: "COD",
          err: true,
        });
      }
  
      // Retrieve all cart items for the user
      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
  
      // Check for quantity availability
      let flag = 0;
      cartItems.forEach((element) => {
        if (element.products.quantity > element.variations[0].quantity) {
          flag = 1;
        }
      });
  
      if (flag === 1) {

        return res.json({
          url: "/addToCart",
          paymentMethode: "COD",
          err: true,
        });
      }


  
      // Retrieve coupon details
      const couponDetails = await userHelper.getCoupon(coupon);
      if (couponDetails) {
        await userHelper.UpdateCouponCount(couponDetails._id);
      }
  
      // Initialize total coupon discount amount
      let totalCouponDiscountAmount = 0;
  
      // Create order items
      const orderItems = cartItems.map((element) => {
        const orderItem = {
          productId: element.products.productId,
          pName: element.pDetails[0].pName,
          category: element.pDetails[0].category,
          pDescription: element.pDetails[0].pDescription,
          quantity: element.products.quantity,
          offerDiscountAmount: Math.round(
            (element.pDetails[0].fPrice * element.products.quantity * element.allOffers) / 100
          ),
          fPrice: element.pDetails[0].fPrice,
          lPrice: element.pDetails[0].lPrice,
          color: element.variations[0].color,
          size: element.variations[0].size,
          images: element.variations[0].images[0],
          couponDiscountAmount: element.couponDiscountAmount || 0,
        };
  
        // Calculate coupon discount amount if applicable
        if (couponDetails && (couponDetails.category === "All" || couponDetails.category === orderItem.category)) {
          orderItem.couponDiscountAmount = Math.round(
            (orderItem.fPrice * orderItem.quantity * couponDetails.discount) / 100
          );
        } else {
          orderItem.couponDiscountAmount = 0;
        }
  
        // Accumulate total coupon discount amount
        totalCouponDiscountAmount += orderItem.couponDiscountAmount;
  
        return orderItem;
      });
  
      // Update product quantities and calculate total price
      let tPrice = 0;
  
      for (const element of orderItems) {
        await ProductVariationdb.updateOne(
          { productId: element.productId },
          { $inc: { quantity: element.quantity * -1 } }
        );
  
        tPrice += element.quantity * element.lPrice - element.couponDiscountAmount;
      }
  
      if (Number(offerPrice)) {
        tPrice -= Number(offerPrice);
      }
  
      // Create a new order
      const orderId = uuidv4();
  
      const newOrder = new orderdb({
        userId: req.session.isUserAuth,
        orderId: orderId,
        orderItems: orderItems,
        paymentMethode: paymentMethode,
        address: address.address,
        totalPrice: tPrice,
        couponDiscountAmount: totalCouponDiscountAmount,
      });
  
      // Handle payment methods
      if (paymentMethode === "COD") {
        await newOrder.save();
        await Cartdb.updateOne(
          { userId: req.session.isUserAuth },
          { $set: { products: [] } }
        ); // empty cart items
        return res.json({
          url: "/userOrderSuccessfull",
          paymentMethode: "COD",
        });
      } else if (paymentMethode === "razorpay") {

        try {
          const options = {
            amount: tPrice * 100,
            currency: "INR",
            receipt: "" + newOrder._id,
          };
  
          const order = await instance.orders.create(options);
  
          req.session.newOrder = newOrder;
  
          return res.json({
            order,
            paymentMethode: "razorpay",
            keyId: process.env.key_id,
          });
        } catch (err) {
          console.error("Razorpay err", err);
          return res.status(500).render("errorPages/500ErrorPage");
        }
      } else if (paymentMethode === "wallet") {
        try {
          const userId = req.session.isUserAuth;
          const walletBalance = await userHelper.getWalletBalance(userId);
  
          if (walletBalance < tPrice) {
            return res.status(400).json({
              message: "Insufficient wallet balance",
            });
          }
  
          // Deduct the order amount from the wallet balance
          await UserWalletdb.updateOne(
            { userId: userId },
            { $inc: { walletBalance: (-1 * tPrice) },
            $push: {
              transactions: {
                amount: (-1 * tPrice),
              },
            }
           }
          );
  
          await newOrder.save();
          await Cartdb.updateOne(
            { userId: userId },
            { $set: { products: [] } }
          ); // empty cart items
  
          return res.json({
            url: "/orderSuccessfull",
            paymentMethode: "wallet",
          });
        } catch (error) {
          console.error("wallet err", error);
          return res.status(500).render("errorPages/500ErrorPage");
        }
      }
    } catch (err) {
      console.error("Main err in user cart checkout", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  
  //   ----------------------------------------------------------------------------------------------------------

  isCouponValidCart: async (req, res) => {
    try {
      const coupon = await userHelper.getCoupon(req.body.code);

      if (!coupon) {
        return res.status(401).json({
          err: true,
          reload: false,
          message: "Invalid coupon code",
        });
      }

      if (new Date(coupon.expiry) < new Date()) {
        return res.status(401).json({
          err: true,
          reload: false,
          message: "Coupon expired",
        });
      }

      if (coupon.count <= 0) {
        return res.status(401).json({
          err: true,
          reload: false,
          message: `This coupon is Expired`,
        });
      }

      //user Helper fn to get product all product in cart
      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );
      let minPriceErr = false;
      const total = cartItems.reduce((total, value) => {
        return (total += Math.round(
          value.pDetails[0].fPrice * value.products.quantity
        ));
      }, 0);

      const totalDiscount = cartItems.reduce((total, value, i) => {
        if (
          (value.pDetails[0].category === coupon.category ||
            coupon.category === "All") &&
          total >= coupon.minPrice
        ) {
          return (total += Math.round((total * coupon.discount) / 100));
        }

        if (total < coupon.minPrice) {
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

      res.status(200).json({
        status: true,
        message: `Coupon code ${coupon.code} applied successfully!`,
        totalDiscount,
        coupon,
        minPriceErr,
        total,
      });
    } catch (err) {
      console.error("isCoupon cart err", err);
      res.status(500).json({
        err: true,
        reload: true,
        message: "errorPages/500ErrorPage",
      });
    }
  },

  // --------------------------------------------------------------------------------------------------------------------
};
