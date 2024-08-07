const ProductVariationdb =
  require("../../model/adminSide/productModel").ProductVariationdb;
const userVariationdb = require("../../model/userSide/userVariationModel");
const userHelper = require("../../databaseHelpers/userHelper");
const Cartdb = require("../../model/userSide/cartModel");
const orderdb = require("../../model/userSide/orderModel");
const Razorpay = require("razorpay");
const { v4: uuidv4 } = require("uuid");
const UserWalletdb = require("../../model/userSide/walletModel");
const instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

// -----------------------------------------------------------------------------------------------------
module.exports = {
  userCartNow: async (req, res) => {
    try {
      if (!req.session.isUserAuth) {
        return res.status(401).json({
          success: false,
          message: "Please log in to add items to the cart",
        });
      }

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

        return res.status(200).json({
          success: true,
          message: "Product added to cart",
        });
      } else {
        return res.status(402).json({
          success: false,
          message: "Product already exists in cart",
        });
      }
    } catch (err) {
      console.error(err, "rerre");
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
        { $set: { products: [] } }
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
      const { productId, values } = req.params;
      const userId = req.session.isUserAuth;

      const cartProduct = await Cartdb.findOne(
        {
          userId: userId,
          "products.productId": productId,
        },
        { "products.$": 1 }
      );

      const stock = await ProductVariationdb.findOne(
        { productId: productId },
        { quantity: 1 }
      );

      const quantityChange = parseInt(values);

      if (quantityChange === 0) {
        return res.json({
          message: "Invalid quantity value",
          result: false,
        });
      }

      if (
        quantityChange > 0 &&
        cartProduct.products[0].quantity + quantityChange > stock.quantity
      ) {
        return res.json({
          message: `Only ${stock.quantity} stocks available`,
          result: false,
          stock: stock.quantity,
        });
      }

      if (
        quantityChange > 0 &&
        cartProduct.products[0].quantity + quantityChange > 10
      ) {
        return res.json({
          message: "Quantity cannot be greater than 10",
          result: false,
          stock: stock.quantity,
        });
      }

      if (
        quantityChange < 0 &&
        cartProduct.products[0].quantity + quantityChange < 1
      ) {
        return res.json({
          message: "Quantity cannot be less than 1",
          result: false,
          stock: stock.quantity,
        });
      }

      const updatedQuantity = cartProduct.products[0].quantity + quantityChange;

      if (updatedQuantity === 0) {
        await Cartdb.updateOne(
          {
            userId: userId,
            "products.productId": productId,
          },
          { $pull: { products: { productId: productId } } }
        );

        const cartItems = await userHelper.getCartItemsAll(userId);
        const discount = cartItems.reduce((total, value) => {
          const fPrice = value.pDetails[0].fPrice;
          const lPrice = value.pDetails[0].lPrice;
          const discountAmount = (fPrice - lPrice) * value.products.quantity;
          return total + discountAmount;
        }, 0);

        const total = cartItems.reduce((total, value) => {
          return total + value.pDetails[0].lPrice * value.products.quantity;
        }, 0);

        return res.json({
          message: "Product removed from cart due to zero stock",
          result: true,
          total,
          discount,
          cartItems,
        });
      } else {
        await Cartdb.updateOne(
          {
            userId: userId,
            "products.productId": productId,
          },
          { $inc: { "products.$.quantity": quantityChange } }
        );

        const cartItems = await userHelper.getCartItemsAll(userId);
        const discount = cartItems.reduce((total, value) => {
          const fPrice = value.pDetails[0].fPrice;
          const lPrice = value.pDetails[0].lPrice;
          const discountAmount = (fPrice - lPrice) * value.products.quantity;
          return total + discountAmount;
        }, 0);

        const total = cartItems.reduce((total, value) => {
          return total + value.pDetails[0].lPrice * value.products.quantity;
        }, 0);

        return res.json({
          message: "Successful quantity update",
          result: true,
          total,
          discount,
          cartItems,
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error", result: false });
    }
  },

  // ----------------------------------------------------------------------------------------------------------

  userCartCheckOut: async (req, res) => {
    try {
      const { paymentMethode, adId, coupon, offerPrice } = req.body;
      const userId = req.session.isUserAuth;
  
      if (!paymentMethode) {
        req.session.payErr = "Choose a payment method";
      }
  
      if (!adId) {
        req.session.adErr = "Choose an Address";
      }
  
      const address = adId
        ? await userVariationdb.findOne(
            { userId: userId, "address._id": adId },
            { "address.$": 1, _id: 0 }
          )
        : null;
  
      if (!address) {
        req.session.adErr = "Invalid address. Choose an Address";
      }
  
      if (req.session.payErr || req.session.adErr) {
        return res.json({
          url: "/cartCheckOut",
          paymentMethode: "COD",
          err: true,
        });
      }
  
      const cartItems = await userHelper.getCartItemsAll(userId);
  
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
  
      const couponDetails = await userHelper.getCoupon(coupon);
      if (couponDetails) {
        await userHelper.UpdateCouponCount(couponDetails._id);
      }
  
      let totalCouponDiscountAmount = 0;
  
      const orderItems = cartItems.map((element) => {
        const orderItem = {
          productId: element.products.productId,
          pName: element.pDetails[0].pName,
          category: element.pDetails[0].category,
          pDescription: element.pDetails[0].pDescription,
          quantity: element.products.quantity,
          offerDiscountAmount: Math.round(
            (element.pDetails[0].fPrice *
              element.products.quantity *
              element.allOffers) /
              100
          ),
          fPrice: element.pDetails[0].fPrice,
          lPrice: element.pDetails[0].lPrice,
          color: element.variations[0].color,
          size: element.variations[0].size,
          images: element.variations[0].images[0],
          couponDiscountAmount: element.couponDiscountAmount || 0,
          totalAmount:
            element.pDetails[0].lPrice * element.products.quantity -
            Math.round(
              (element.pDetails[0].fPrice *
                element.products.quantity *
                element.allOffers) /
                100
            ),
        };
  
        if (
          couponDetails &&
          (couponDetails.category === "All" ||
            couponDetails.category === orderItem.category)
        ) {
          orderItem.couponDiscountAmount = Math.round(
            (orderItem.fPrice * orderItem.quantity * couponDetails.discount) /
              100
          );
        } else {
          orderItem.couponDiscountAmount = 0;
        }
  
        totalCouponDiscountAmount += orderItem.couponDiscountAmount;
  
        return orderItem;
      });
  
      let tPrice = 0;
  
      for (const element of orderItems) {
        await ProductVariationdb.updateOne(
          {
            productId: element.productId,
            "variations.color": element.color,
            "variations.size": element.size,
          },
          { $inc: { "variations.$.quantity": -element.quantity } }
        );
  
        tPrice +=
          element.quantity * element.lPrice - element.couponDiscountAmount;
      }
  
      if (Number(offerPrice)) {
        tPrice -= Number(offerPrice);
      }
  
      // Add 10 if total amount is below 1000
      if (tPrice < 1000) {
        tPrice += 10;
      }
  
      const orderId = uuidv4(); 
  
      const newOrder = new orderdb({
        userId: userId,
        orderId: orderId,
        orderItems: orderItems,
        paymentMethode: paymentMethode,
        address: address.address,
        totalPrice: tPrice,
        couponDiscountAmount: totalCouponDiscountAmount,
      });
  
      if (paymentMethode === "COD") {
        if (tPrice > 1000) {
          return res.status(400).json({
            message: "Order above Rs 1000 is not allowed for COD",
            err: true,
          });
        }
        await newOrder.save();
        await Cartdb.updateOne({ userId: userId }, { $set: { products: [] } });
        return res.json({
          url: "/userOrderSuccessfull",
          paymentMethode: "COD",
          orderId: orderId, 
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
            orderId: orderId, 
          });
        } catch (err) {
          console.error("Razorpay error", err);
          return res.status(500).render("errorPages/500ErrorPage");
        }
      } else if (paymentMethode === "wallet") {
        try {
          const walletBalance = await userHelper.getWalletBalance(userId);
  
          if (walletBalance < tPrice) {
            return res.status(400).json({
              message: "Insufficient wallet balance",
              err: true,
            });
          }
  
          await UserWalletdb.updateOne(
            { userId: userId },
            {
              $inc: { walletBalance: -tPrice },
              $push: {
                transactions: {
                  amount: -tPrice,
                  status: "Purchased",
                  details: orderId, 
                },
              },
            }
          );
  
          await newOrder.save();
          await Cartdb.updateOne(
            { userId: userId },
            { $set: { products: [] } }
          );
  
          return res.json({
            url: "/orderSuccessfull",
            paymentMethode: "wallet",
            orderId: orderId, 
          });
        } catch (error) {
          console.error("Wallet error", error);
          return res.status(500).render("errorPages/500ErrorPage");
        }
      }
    } catch (err) {
      console.error("Main error in user cart checkout", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  

  //   ----------------------------------------------------------------------------------------------------------
  isCouponValidCart: async (req, res) => {
    try {
        const { code } = req.body;

        const coupon = await userHelper.getCoupon(code);

        if (!coupon) {
            return res.status(400).json({
                err: true,
                reload: false,
                errorMessage: "Invalid coupon code",
            });
        }

        if (new Date(coupon.expiry) < new Date()) {
            return res.status(400).json({
                err: true,
                reload: false,
                errorMessage: "Coupon expired",
            });
        }

        if (coupon.count <= 0) {
            return res.status(400).json({
                err: true,
                reload: false,
                errorMessage: "This coupon is no longer available",
            });
        }

        const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);

        const total = cartItems.reduce((total, item) => {
            const itemPrice = item.pDetails[0].lPrice * item.products.quantity;
            const discountedPrice = itemPrice * (1 - item.allOffers / 100);
            return total + Math.round(discountedPrice);
        }, 0);

        if (total < coupon.minPrice) {
            return res.status(400).json({
                err: true,
                reload: false,
                errorMessage: `This coupon is for orders greater than or equal to ₹${coupon.minPrice}`,
            });
        }

        let totalDiscount = 0;
        cartItems.forEach((item) => {
            const itemPrice = item.pDetails[0].lPrice * item.products.quantity;
            const discountAmount = (itemPrice * coupon.discount) / 100;
            totalDiscount += Math.round(discountAmount);
        });

        res.status(200).json({
            status: true,
            errorMessage: `Coupon code ${coupon.code} applied successfully!`,
            totalDiscount,
            coupon,
            total,
        });
    } catch (err) {
        console.error("isCouponValidCart error:", err);
        res.status(500).json({
            err: true,
            reload: true,
            errorMessage: "An unexpected error occurred. Please try again later.",
        });
    }
},


};
