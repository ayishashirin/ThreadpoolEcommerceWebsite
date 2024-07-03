const Cartdb = require("../model/userSide/cartModel");
const Productdb = require("../model/adminSide/productModel").Productdb;
const Userdb = require("../model/userSide/userModel");
const { ProductVariationdb } = require("../model/adminSide/productModel");
const Categorydb = require("../model/adminSide/category").Categorydb;
const userVariationdb = require("../model/userSide/userVariationModel");
const Orderdb = require("../model/userSide/orderModel");
const { mongoose, isObjectIdOrHexString } = require("mongoose");
const referralOfferdb = require("../model/adminSide/referralOfferModel");
const UserWalletdb = require("../model/userSide/walletModel");
const Wishlistdb = require("../model/userSide/wishlist");
const coupondb = require("../model/adminSide/couponModel");
const comparedb = require("../model/userSide/compareModel");

module.exports = {
  getSingleProducts: async (productId = null) => {
    try {
      const products = await Productdb.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(productId),
          },
        },
        {
          $lookup: {
            from: "offerdbs",
            localField: "pDetails.offers",
            foreignField: "_id",
            as: "allOffers",
          },
        },
        {
          $lookup: {
            from: "productvariationdbs",
            localField: "_id",
            foreignField: "productId",
            as: "variations",
          },
        },
      ]);
      products.forEach((each) => {
        each.allOffers = each.allOffers.reduce((total, offer) => {
          if (offer.expiry >= new Date() && offer.discount > total) {
            return (total = offer.discount);
          }

          return total;
        }, 0);
      });

      return products;
    } catch (err) {
      throw err;
    }
  },
  getRelatedProducts: async (productId = null) => {
    try {
      const getProductDetails = await Productdb.findOne({ _id: productId });

      const category = await getProductDetails.category;

      const relatedProducts = await Productdb.aggregate([
        {
          $match: {
            unlistedProduct: false,
            category: category,
            _id: { $ne: productId },
          },
        },

        {
          $lookup: {
            from: "productvariationdbs",
            localField: "_id",
            foreignField: "productId",
            as: "variations",
          },
        },
      ]);

      return relatedProducts;
    } catch (err) {
      throw err;
    }
  },

  getComparedProducts: async (productId = null) => {
    try {
      const getProductDetails = await Productdb.findOne({ _id: productId });

      const category = await getProductDetails.category;

      const comparedProducts = await Productdb.aggregate([
        {
          $match: {
            unlistedProduct: false,
            category: category,
            _id: { $ne: productId },
          },
          $limit: 3,
        },

        {
          $lookup: {
            from: "productvariationdbs",
            localField: "_id",
            foreignField: "productId",
            as: "variations",
          },
        },
      ]);

      return comparedProducts;
    } catch (err) {
      throw err;
    }
  },
  userInfo: async (userId) => {
    try {
      const agg = [
        {
          $match: {
            _id: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: "uservariationdbs",
            localField: "_id",
            foreignField: "userId",
            as: "variations",
          },
        },
      ];
      const userInfo = await Userdb.aggregate(agg);
      return userInfo[0];
    } catch (err) {
      throw err;
    }
  },

  userSingleProductCategory: async (search = {}) => {
    try {
      let filterConditions = { unlistedProduct: false };

      if (search.genderCat) {
        filterConditions.category = search.genderCat;
      }

      if (search.maxPrice) {
        filterConditions.fPrice = { $lte: parseFloat(search.maxPrice) };
      }

      const validSizes = ["XS", "S", "M", "L", "XL", "XXL"];
      const validColors = [
        "Black",
        "Red",
        "Yellow",
        "White",
        "Blue",
        "Green",
        "Pink",
        "Violet",
      ];

      let filter = { $match: filterConditions };

      const page = Number(search.page);
      const skip = page && page > 0 ? (page - 1) * 12 : 0;

      let sortOrder = {};
      switch (search.sortOrder) {
        case "priceAsc":
          sortOrder = { lPrice: 1 };
          break;
        case "priceDesc":
          sortOrder = { lPrice: -1 };
          break;
        case "aATozZ":
          sortOrder = { aATozZ: -1 };
          break;
        case "zZToaA":
          sortOrder = { zZToaA: -1 };
          break;
        case "latest":
          sortOrder = { date: -1 };
          break;
        default:
          sortOrder = { _id: 1 };
          break;
      }

      const agg = [
        filter,
        {
          $lookup: {
            from: "productvariationdbs",
            localField: "_id",
            foreignField: "productId",
            as: "variations",
          },
        },
        {
          $unwind: "$variations",
        },

        ...(validSizes.includes(search.size)
          ? [{ $match: { "variations.size": search.size } }]
          : []),

        ...(validColors.includes(search.color)
          ? [{ $match: { "variations.color": search.color } }]
          : []),
        { $sort: sortOrder },
        { $skip: skip },
        { $limit: 12 },
        {
          $lookup: {
            from: "offerdbs",
            localField: "offers",
            foreignField: "_id",
            as: "allOffers",
          },
        },
        {
          $group: {
            _id: "$_id",
            pName: { $first: "$pName" },
            category: { $first: "$category" },
            pDescription: { $first: "$pDescription" },
            fPrice: { $first: "$fPrice" },
            lPrice: { $first: "$lPrice" },
            date: { $first: "$date" },
            newlyLaunched: { $first: "$newlyLaunched" },
            unlistedProduct: { $first: "$unlistedProduct" },
            offers: { $first: "$offers" },
            allOffers: { $first: "$allOffers" },
            variations: { $push: "$variations" },
          },
        },
      ];

      const products = await Productdb.aggregate(agg);

      products.forEach((each) => {
        each.allOffers = each.allOffers.reduce((maxDiscount, offer) => {
          if (offer.expiry >= new Date() && offer.discount > maxDiscount) {
            return offer.discount;
          }
          return maxDiscount;
        }, 0);
      });

      return products;
    } catch (err) {
      throw err;
    }
  },

  getProductDetails: async (productId, newlyLauched = false) => {
    try {
      if (newlyLauched) {
        const products = await Productdb.aggregate([
          {
            $match: {
              newlyLaunched: true,
              unlistedProduct: false,
            },
          },
          {
            $lookup: {
              from: "offerdbs",
              localField: "offers",
              foreignField: "_id",
              as: "allOffers",
            },
          },
          {
            $lookup: {
              from: "productvariationdbs",
              localField: "_id",
              foreignField: "productId",
              as: "variations",
            },
          },
        ]);

        products.forEach((each) => {
          each.allOffers = each.allOffers.reduce((total, offer) => {
            if (offer.expiry >= new Date() && offer.discount > total) {
              return (total = offer.discount);
            }

            return total;
          }, 0);
        });

        return products;
      }

      if (!isObjectIdOrHexString(productId)) {
        return [null];
      }

      const products = await Productdb.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(productId),
          },
        },
        {
          $lookup: {
            from: "offerdbs",
            localField: "offers",
            foreignField: "_id",
            as: "allOffers",
          },
        },
        {
          $lookup: {
            from: "productvariationdbs",
            localField: "_id",
            foreignField: "productId",
            as: "variations",
          },
        },
      ]);

      products.forEach((each) => {
        each.allOffers = each.allOffers.reduce((total, offer) => {
          if (offer.expiry >= new Date() && offer.discount > total) {
            return (total = offer.discount);
          }

          return total;
        }, 0);
      });

      return products;
    } catch (err) {
      throw err;
    }
  },

  getAllListedCategory: async () => {
    try {
      return await Categorydb.find({ status: true });
    } catch (err) {
      throw err;
    }
  },
  isOrdered: async (productId, userId, orderId = null) => {
    try {
      if (orderId) {
        const isOrder = await Orderdb.findOne({
          _id: orderId,
          userId: userId,
          "orderItems.productId": productId,
          "orderItems.orderStatus": "Delivered",
        });

        if (!isOrder) {
          return null;
        }

        const dOrders = isOrder.orderItems.filter(
          (value) => value.orderStatus === "Delivered"
        );

        if (dOrders.length === 0) {
          return null;
        }

        isOrder.orderItems = dOrders;

        return isOrder;
      }

      const isOrder = await Orderdb.findOne({
        userId: userId,
        "orderItems.productId": productId,
        "orderItems.orderStatus": "Delivered",
      });

      return isOrder;
    } catch (err) {
      throw err;
    }
  },

  isProductCartItem: async (productId, userId) => {
    try {
      if (!userId) {
        return false;
      }

      const isCartItem = await Cartdb.findOne({
        userId: userId,
        "products.productId": productId,
      });
      return isCartItem ? true : false;
    } catch (err) {
      throw err;
    }
  },

  getCartItemsAll: async (userId) => {
    try {
      const agg = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$products",
          },
        },
        {
          $lookup: {
            from: "productdbs",
            localField: "products.productId",
            foreignField: "_id",
            as: "pDetails",
          },
        },
        {
          $match: {
            "pDetails.unlistedProduct": false,
          },
        },
        {
          $lookup: {
            from: "offerdbs",
            localField: "pDetails.offers",
            foreignField: "_id",
            as: "allOffers",
          },
        },
        {
          $lookup: {
            from: "productvariationdbs",
            localField: "products.productId",
            foreignField: "productId",
            as: "variations",
          },
        },
      ];

      const products = await Cartdb.aggregate(agg);

      products.forEach((each) => {
        each.allOffers = each.allOffers.reduce((total, offer) => {
          if (offer.expiry >= new Date() && offer.discount > total) {
            return (total = offer.discount);
          }

          return total;
        }, 0);
      });

      return products;
    } catch (err) {
      throw err;
    }
  },
  getWishlistItemsAll: async (userId) => {
    try {
      const agg = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$products",
          },
        },
        {
          $lookup: {
            from: "productdbs",
            localField: "products.productId",
            foreignField: "_id",
            as: "pDetails",
          },
        },
        {
          $match: {
            "pDetails.unlistedProduct": false,
          },
        },
        {
          $lookup: {
            from: "offerdbs",
            localField: "pDetails.offers",
            foreignField: "_id",
            as: "allOffers",
          },
        },
        {
          $lookup: {
            from: "productvariationdbs",
            localField: "products.productId",
            foreignField: "productId",
            as: "variations",
          },
        },
      ];

      const products = await Wishlistdb.aggregate(agg);

      products.forEach((each) => {
        each.allOffers = each.allOffers.reduce((total, offer) => {
          if (offer.expiry >= new Date() && offer.discount > total) {
            return (total = offer.discount);
          }

          return total;
        }, 0);
      });
      return products;
    } catch (err) {
      throw err;
    }
  },

  getCompareItemsAll: async (userId) => {
    try {
      const agg = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$products",
          },
        },
        {
          $lookup: {
            from: "productdbs",
            localField: "products.productId",
            foreignField: "_id",
            as: "pDetails",
          },
        },
        {
          $match: {
            "pDetails.unlistedProduct": false,
          },
        },
        {
          $lookup: {
            from: "offerdbs",
            localField: "pDetails.offers",
            foreignField: "_id",
            as: "allOffers",
          },
        },
        {
          $lookup: {
            from: "productvariationdbs",
            localField: "products.productId",
            foreignField: "productId",
            as: "variations",
          },
        },
      ];

      const products = await comparedb.aggregate(agg);

      products.forEach((each) => {
        each.allOffers = each.allOffers.reduce((total, offer) => {
          if (offer.expiry >= new Date() && offer.discount > total) {
            return (total = offer.discount);
          }

          return total;
        }, 0);
      });
      return products;
    } catch (err) {
      throw err;
    }
  },
  isProductWishlistItem: async (productId, userId) => {
    try {
      if (!userId) {
        return false;
      }

      const isWishlistItem = await Wishlistdb.findOne({
        userId: userId,
        "products.productId": productId,
      });
      return isWishlistItem ? true : false;
    } catch (err) {
      throw err;
    }
  },
  isProductCompareItem: async (productId, userId) => {
    try {
      if (!userId) {
        return false;
      }

      const isCompareItem = await comparedb.findOne({
        userId: userId,
        "products.productId": productId,
      });
      return isCompareItem ? true : false;
    } catch (err) {
      throw err;
    }
  },

  getTheCountOfWhislistCart: async (userId) => {
    try {
      if (!userId) {
        return {
          wishlistCount: false,
          cartCount: false,
        };
      }

      const whislistCount = await Wishlistdb.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$products",
          },
        },
        {
          $lookup: {
            from: "productdbs",
            localField: "products",
            foreignField: "_id",
            as: "pDetails",
          },
        },
        {
          $match: {
            "pDetails.unlistedProduct": false,
          },
        },
      ]);

      const cartCount = await Cartdb.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$products",
          },
        },
        {
          $lookup: {
            from: "productdbs",
            localField: "products.productId",
            foreignField: "_id",
            as: "pDetails",
          },
        },
        {
          $match: {
            "pDetails.unlistedProduct": false,
          },
        },
      ]);

      return {
        whislistCount: whislistCount.length,
        cartCount: cartCount.length,
      };
    } catch (err) {
      throw err;
    }
  },

  getTheCountOfCompareCart: async (userId) => {
    try {
      if (!userId) {
        return {
          CompareCount: false,
          cartCount: false,
        };
      }

      const CompareCount = await comparedb.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$products",
          },
        },
        {
          $lookup: {
            from: "productdbs",
            localField: "products",
            foreignField: "_id",
            as: "pDetails",
          },
        },
        {
          $match: {
            "pDetails.unlistedProduct": false,
          },
        },
      ]);

      const cartCount = await Cartdb.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$products",
          },
        },
        {
          $lookup: {
            from: "productdbs",
            localField: "products.productId",
            foreignField: "_id",
            as: "pDetails",
          },
        },
        {
          $match: {
            "pDetails.unlistedProduct": false,
          },
        },
      ]);

      return {
        CompareCount: CompareCount.length,
        cartCount: cartCount.length,
      };
    } catch (err) {
      throw err;
    }
  },
  userTotalProductNumber: async (category) => {
    try {
      return (await Productdb.find({ category, unlistedProduct: false }))
        .length;
    } catch (err) {
      throw err;
    }
  },
  userRegisterWithOrWithoutRefferal: async (query) => {
    try {
      if (!query?.referralCode) {
        return null;
      }

      const referr = await Userdb.findOne({ referralCode: query.referralCode });

      if (!referr) {
        return {
          referralCodeStatus: false,
          message: "Invalid Referral Code",
        };
      }

      const referralOffer = await referralOfferdb.findOne({
        expiry: { $gte: Date.now() },
      });

      if (!referralOffer) {
        return {
          referralCodeStatus: false,
          message: "Referral Offer Expired",
        };
      }

      return {
        referralCodeStatus: true,
        referralCode: query.referralCode,
      };
    } catch (err) {
      throw err;
    }
  },
  giveOffer: async (referredByCode, newUserId) => {
    try {
      const referr = await Userdb.findOneAndUpdate(
        { referralCode: referredByCode },
        { $inc: { referralCount: 1 } }
      );
      const offerRewards = await referralOfferdb.findOne(
        {},
        { _id: 0, discription: 0 }
      );

      await UserWalletdb.updateOne(
        { userId: referr._id },
        {
          $inc: {
            walletBalance: offerRewards.referralRewards,
          },
          $push: {
            transactions: {
              amount: offerRewards.referralRewards,
            },
          },
        },
        { upsert: true }
      );

      const newUserWallet = new UserWalletdb({
        userId: newUserId,
        walletBalance: offerRewards.referredUserRewards,
        transactions: [
          {
            amount: offerRewards.referredUserRewards,
          },
        ],
      });

      await newUserWallet.save();

      return;
    } catch (err) {
      throw err;
    }
  },
  getUserWallet: async (userId) => {
    try {
      return await UserWalletdb.findOne({ userId });
    } catch (err) {
      throw err;
    }
  },

  getSingleAddress: async (userId, addressId) => {
    try {
      const address = await userVariationdb.findOne({
        $and: [{ userId: userId }, { "address._id": addressId }],
      });

      return address?.address?.find((value) => {
        return String(value._id) === String(addressId);
      });
    } catch (err) {
      throw err;
    }
  },

  getAllOrdersOfUser: async (userId) => {
    const totalOrders = await Orderdb.find({ userId }).sort({ orderDate: -1 });
    return totalOrders;
  },

  userGetAllOrder: async (userId, pageNo = 1) => {
    try {
      const skip = (Number(pageNo) - 1) * 12;
      const totalOrders = await Orderdb.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
      });

      const agg = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $sort: {
            orderDate: -1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: 12,
        },
      ];

      const orders = await Orderdb.aggregate(agg);

      return {
        orders,
        totalOrders,
      };
    } catch (err) {
      throw err;
    }
  },
  userGetAllOrder: async (userId, pageNo = 1) => {
    try {
      const skip = (Number(pageNo) - 1) * 12;
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const totalOrders = await Orderdb.countDocuments({
        userId: userObjectId,
      });

      const orders = await Orderdb.aggregate([
        { $match: { userId: userObjectId } },
        { $sort: { orderDate: -1 } },
        { $skip: skip },
        { $limit: 12 },
      ]);

      return {
        orders,
        totalOrders,
      };
    } catch (err) {
      throw err;
    }
  },
  getOrderItemsAll: async (userId) => {
    try {
      const agg = [
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$products",
          },
        },
        {
          $lookup: {
            from: "offerdbs",
            localField: "pDetails.offers",
            foreignField: "_id",
            as: "allOffers",
          },
        },
        {
          $lookup: {
            from: "productdbs",
            localField: "products.productId",
            foreignField: "_id",
            as: "pDetails",
          },
        },
        {
          $match: {
            "pDetails.unlistedProduct": false,
          },
        },
        {
          $lookup: {
            from: "productvariationdbs",
            localField: "products.productId",
            foreignField: "productId",
            as: "variations",
          },
        },
        {
          $sort: { orderDate: -1 },
        },
      ];

      const products = await Cartdb.aggregate(agg);

      products.forEach((each) => {
        each.allOffers = each.allOffers.reduce((total, offer) => {
          if (offer.expiry >= new Date() && offer.discount > total) {
            return (total = offer.discount);
          }

          return total;
        }, 0);
      });

      return products;
    } catch (err) {
      throw err;
    }
  },

  getSingleOrderOfDetails: async (params, userId) => {
    try {
      if (
        !isObjectIdOrHexString(params.orderId) ||
        !isObjectIdOrHexString(params.productId)
      ) {
        return null;
      }

      const [orders] = await Orderdb.aggregate([
        {
          $unwind: {
            path: "$orderItems",
          },
        },
        {
          $match: {
            $and: [
              { _id: new mongoose.Types.ObjectId(params.orderId) },
              {
                "orderItems.productId": new mongoose.Types.ObjectId(
                  params.productId
                ),
              },
              { userId: new mongoose.Types.ObjectId(userId) },
            ],
          },
        },
      ]);
      return orders;
    } catch (err) {
      throw err;
    }
  },

  getUserWallet: async (userId) => {
    try {
      return await UserWalletdb.findOne({ userId });
    } catch (err) {
      throw err;
    }
  },

  addProductToWishList: async (userId, productId) => {
    try {
      const product = await Productdb.findOne({ _id: productId });

      if (!product) {
        return;
      }

      return await Wishlistdb.updateOne(
        { userId: userId },
        {
          $push: {
            products: productId,
          },
        },
        { upsert: true }
      );
    } catch (err) {
      throw err;
    }
  },
  addProductToCompare: async (userId, productId) => {
    try {
      const product = await Productdb.findOne({ _id: productId });

      if (!product) {
        return;
      }

      return await comparedb.updateOne(
        { userId: userId },
        {
          $push: {
            products: productId,
          },
        },
        { upsert: true }
      );
    } catch (err) {
      throw err;
    }
  },
  getWishlistItems: async (userId) => {
    try {
      if (!userId) {
        return null;
      }
      return await Wishlistdb.findOne({ userId: userId });
    } catch (err) {
      throw err;
    }
  },
  
  getCompareItems: async (userId) => {
    try {
      if (!userId) {
        return null;
      }
      return await comparedb.findOne({ userId: userId });
    } catch (err) {
      throw err;
    }
  },
  getCoupon: async (code, couponId = null) => {
    try {
      if (couponId && isObjectIdOrHexString(couponId)) {
        return await coupondb.findOne({ _id: couponId });
      }

      code = code.toString().trim();
      const coupon = await coupondb.findOne({ code: code });

      return coupon;
    } catch (err) {
      console.error("Error in getCoupon:", err);
      throw err;
    }
  },

  UpdateCouponCount: async (couponId) => {
    try {
      if (couponId && !isObjectIdOrHexString(couponId)) {
        return;
      }

      return await coupondb.updateOne(
        { _id: couponId },
        { $inc: { count: -1 } }
      );
    } catch (err) {
      throw err;
    }
  },

  userOrderCancel: async (orderId, productId, userId = null) => {
    try {
      const order = await Orderdb.findOneAndUpdate(
        {
          $and: [{ _id: orderId }, { "orderItems.productId": productId }],
        },
        {
          $set: {
            "orderItems.$.orderStatus": "Cancelled",
          },
        },
        { new: true }
      );
  
      const orderItem = order.orderItems.find(
        (value) => String(value.productId) === productId
      );
  
      let refundAmount = orderItem.totalAmount;
  
      if (refundAmount < 1000) {
        refundAmount += 10;
      }
  
      if (
        (orderItem.orderStatus === "Cancelled" ||
          order.paymentMethode === "razorpay" ||
          order.paymentMethode === "wallet") &&
        userId
      ) {
        await UserWalletdb.updateOne(
          { userId: userId },
          {
            $inc: {
              walletBalance: refundAmount,
            },
            $push: {
              transactions: {
                amount: refundAmount,
                status: "Order Cancelled",
                details: orderId,
              },
            },
          },
          { upsert: true }
        );
      }
  
      await ProductVariationdb.updateOne(
        {
          productId: productId,
          "variations.color": orderItem.color,
          "variations.size": orderItem.size,
        },
        {
          $inc: {
            "variations.$.quantity": orderItem.quantity,
          },
        }
      );
  
      return;
    } catch (err) {
      throw err;
    }
  },
  
  userTotalProductNumber: async (category) => {
    try {
      const products = await Productdb.find({ unlistedProduct: false });
      return products.length;
    } catch (err) {
      throw err;
    }
  },
  getWalletBalance: async (userId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const user = await UserWalletdb.findOne({ userId });
      if (!user) {
        throw new Error("User not found");
      }

      return user.walletBalance;
    } catch (error) {
      console.error("Error in getWalletBalance:", error);
      throw new Error("Error fetching wallet balance");
    }
  },
};
