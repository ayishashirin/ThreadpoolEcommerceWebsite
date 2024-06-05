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

   userSingleProductCategory : async (search = {}) => {
    try {
      let filterConditions = { unlistedProduct: false };
  
      // Adding category filter if genderCat is provided
      if (search.genderCat) {
        filterConditions.category = search.genderCat;
      }
  
      // Text search stage
      if (search.search) {
        filterConditions.$text = { $search: search.search };
      }
  
      // Adding price filter if maxPrice is provided
      if (search.maxPrice) {
        filterConditions.fPrice = { $lte: parseFloat(search.maxPrice) };
      }
  
      // Valid sizes and colors arrays
      const validSizes = ["XS", "S", "M", "L", "XL", "XXL"];
      const validColors = [
        "Black",
        "Red",
        "Yellow",
        "White",
        "Blue",
        "Green",
        "Pink",
        "BlueViolet",
      ];
  
      // Creating the filter match stage for aggregation
      let filter = { $match: filterConditions };
  
      // Calculating the skip value for pagination
      const page = Number(search.page);
      const skip = page && page > 0 ? (page - 1) * 12 : 0;
  
      // Determine the sort order
      let sortOrder = {};
      switch (search.sortOrder) {
        case 'priceAsc':
          sortOrder = { lPrice: 1 };
          break;
        case 'priceDesc':
          sortOrder = { lPrice: -1 };
          break;
        case 'aATozZ':
          sortOrder = { aATozZ: -1 }; // Assuming there's a popularity field
          break;
        case 'zZToaA':
          sortOrder = { zZToaA: -1 }; // Assuming there's a rating field
          break;
        case 'latest':
          sortOrder = { date: -1 };
          break;
        default:
          sortOrder = { _id: 1 }; // Default sorting
          break;
      }
  
      // Building the aggregation pipeline
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
        // Adding size filter if a valid size is provided
        ...(validSizes.includes(search.size)
          ? [{ $match: { "variations.size": search.size } }]
          : []),
        // Adding color filter if a valid color is provided
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
  
      // Aggregating to get all product details of the selected category
      const products = await Productdb.aggregate(agg);
  
      // Processing offers to find the maximum valid discount
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
      //for geting newly launched product in home page
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

      //check if the given id is object id in order to prevent err
      if (!isObjectIdOrHexString(productId)) {
        return [null];
      }

      //aggregating to get the details of a single product
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
      //return all listed category
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

      // Check if the product exists in user's cart
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

      //to get all product in cart with all details of produt
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

      //to get all product in wishlist with all details of product
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
  isProductWishlistItem: async (productId, userId) => {
    try {
      if (!userId) {
        return false;
      }

      // Check if the product exists in user's cart
      const isWishlistItem = await Wishlistdb.findOne({
        userId: userId,
        "products.productId": productId,
      });
      return isWishlistItem ? true : false;
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

      // querying to find user whislist doc
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

      // querying to find user cart doc
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

      //return as objects with how many products are there
      return {
        whislistCount: whislistCount.length,
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
      //get the details of the user who referred the new one
      const referr = await Userdb.findOneAndUpdate(
        { referralCode: referredByCode },
        { $inc: { referralCount: 1 } }
      );
      //get offer details of the referr and earn
      const offerRewards = await referralOfferdb.findOne(
        {},
        { _id: 0, discription: 0 }
      );

      // updation the amount in wallet of the user who referred new one
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

      //creating the wallet for new User
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
    const totalOrders = await Orderdb.find({ userId }).sort({orderDate:-1})
    return totalOrders;
  },

  userGetAllOrder: async (userId, pageNo = 1) => {
    try {
      const skip = (Number(pageNo) - 1) * 12;
      const totalOrders = await Orderdb.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
  
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
          $sort: { orderDate: -1 }
      }
      ]

      //to get all product in cart with all details of product
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
  //
  getCoupon: async (code, couponId = null) => {
    try {
      if (couponId && isObjectIdOrHexString(couponId)) {
        return await coupondb.findOne({ _id: couponId });
      }
      return await coupondb.findOne({ code });
    } catch (err) {
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
      //updating orderStatus to cancelled
      const order = await Orderdb.findOneAndUpdate(
        {
          $and: [{ _id: orderId }, { "orderItems.productId": productId }],
        },
        {
          $set: {
            "orderItems.$.orderStatus": "Cancelled",
          },
        }
      );

      // find the product doc to get the qty ordered
      const qty = order.orderItems.find((value) => {
        if (String(value.productId) === productId) {
          return value.quantity;
        }
      });

      //after cancelling a order if its cod and delivered or onlinepayment we have to refund the amount to user
      if (
        (qty.orderStatus === "Cancelled" ||
          order.paymentMethode === "razorpay") &&
        userId
      ) {

        await UserWalletdb.updateOne(
          { userId: userId },
          {
            $inc: {
              walletBalance: Math.round(
                (qty.quantity * qty.fPrice) - (qty.fPrice - qty.lPrice)
              ),
            },
            $push: {
              transactions: {
                amount: Math.round(
                 ( qty.quantity * qty.fPrice) - (qty.fPrice - qty.lPrice)
                ),
              },
            },
          },
          { upsert: true }
        );
      }

      // updating product quantity
      await ProductVariationdb.updateOne(
        { productId: productId },
        {
          $inc: {
            quantity: qty.quantity,
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
      return (await Productdb.find({ category, unlistedProduct: false }))
        .length;
    } catch (err) {
      throw err;
    }
  },
  getWalletBalance: async (userId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }
  
      const user = await UserWalletdb.findOne({userId}); // Ensure you have the correct user model
      if (!user) {
        throw new Error("User not found");
      }
  
      return user.walletBalance; // Ensure this field exists in your user schema
    } catch (error) {
      console.error("Error in getWalletBalance:", error);
      throw new Error("Error fetching wallet balance");
    }
  },
  
};
