const Categorydb = require("../model/adminSide/category").Categorydb;
const Productdb = require("../model/adminSide/productModel").Productdb;
const ProductVariationdb =
  require("../model/adminSide/productModel").ProductVariationdb;
const Userdb = require("../model/userSide/userModel");
const { mongoose, isObjectIdOrHexString } = require("mongoose");
const ReferralOfferdb = require("../model/adminSide/referralOfferModel");
const Orderdb = require("../model/userSide/orderModel");
const UserWalletdb = require("../model/userSide/walletModel");
const Offerdb = require("../model/adminSide/offerModel");
const Coupondb = require("../model/adminSide/couponModel");

module.exports = {
  getCategorydb: async (
    search = null,
    status = true,
    page = 1,
    forSelectBox = false,
    categoryId = null
  ) => {
    try {
      if (categoryId) {
        return await Categorydb.findOne({ _id: categoryId });
      }
      const skip = Number(page) ? Number(page) - 1 : 0;
      if (search) {
        return await Categorydb.find({
          $and: [{ name: { $regex: search, $options: "i" } }, { status }],
        })
          .skip(skip * 12)
          .limit(12);
      }
      if (forSelectBox) {
        return await Categorydb.find({ status });
      }
      return await Categorydb.find({ status })
        .skip(skip * 12)
        .limit(12);
    } catch (err) {
      throw err;
    }
  },
  getAllDashCount: async () => {
    try {
      const userCount = await Userdb.countDocuments();

      const [orders] = await Orderdb.aggregate([
        {
          $unwind: {
            path: "$orderItems",
          },
        },
        {
          $match: {
            "orderItems.orderStatus": "Ordered",
          },
        },
        {
          $count: "newOrders",
        },
      ]);
      const [totalSales] = await Orderdb.aggregate([
        {
          $unwind: {
            path: "$orderItems",
          },
        },
        {
          $match: {
            $or: [
              {
                $and: [
                  { paymentMethode: "COD" },
                  { "orderItems.orderStatus": "Delivered" },
                ],
              },
              {
                $and: [
                  { paymentMethode: "razorpay" },
                  { "orderItems.orderStatus": { $ne: "Cancelled" } },
                ],
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            tSalary: {
              $sum: {
                $multiply: ["$orderItems.lPrice", "$orderItems.quantity"],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]);
      return {
        userCount,
        newOrders: orders?.newOrders,
        tSalary: totalSales?.tSalary,
      };
    } catch (err) {
      throw err;
    }
  },
  adminGetAllUsers: async (search, page = 1) => {
    try {
      const skip = Number(page) ? Number(page) - 1 : 0;
      const agg = [
        {
          $skip: 12 * skip,
        },
        {
          $limit: 12,
        },
      ];

      if (search) {
        agg.splice(0, 0, {
          $match: {
            $or: [
              { fullName: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          },
        });
      }

      return await Userdb.aggregate(agg);
    } catch (err) {
      throw err;
    }
  },
  getProductList: async (status = false, page = 1) => {
    try {
      const skip = Number(page) ? Number(page) - 1 : 0;
      const agg = [
        {
          $match: {
            unlistedProduct: status,
          },
        },
        {
          $skip: 12 * skip,
        },
        {
          $limit: 12,
        },
        {
          $lookup: {
            from: "productvariationdbs",
            localField: "_id",
            foreignField: "productId",
            as: "variations",
          },
        },
      ];
      return await Productdb.aggregate(agg);
    } catch (err) {
      throw err;
    }
  },
  adminGetSingleProduct: async (productId) => {
    try {
      const details = await Productdb.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(productId),
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
      return details;
    } catch (err) {
      throw err;
    }
  },
  adminPageNation: async (management, status = true) => {
    try {
    } catch (err) {
      throw err;
    }
  },

  statusUpdate: async (orderId, productId, orderStatus) => {
    try {
      const orderIdObj = new mongoose.Types.ObjectId(orderId);
      const productIdObj = new mongoose.Types.ObjectId(productId);

      if (orderStatus === "Cancelled") {
        const qty = await Orderdb.findOne(
          {
            $and: [{ _id: orderIdObj }, { "orderItems.productId": productId }],
          },
          { "orderItems.$": 1, _id: 0, userId: 1, paymentMethode: 1 }
        );

        if (qty && qty.paymentMethode === "razorpay") {
          const walletUpdateResult = await UserWalletdb.updateOne(
            { userId: qty.userId },
            {
              $inc: {
                walletBalance: Math.round(
                  qty.orderItems[0].quantity * qty.orderItems[0].lPrice
                ),
              },
              $push: {
                transactions: {
                  amount: Math.round(
                    qty.orderItems[0].quantity * qty.orderItems[0].lPrice
                  ),
                },
              },
            },
            { upsert: true }
          );
        }

        const productUpdateResult = await ProductVariationdb.updateOne(
          { productId: productIdObj },
          { $inc: { quantity: qty.orderItems[0].quantity } }
        );
      }

      const updateResult = await Orderdb.updateOne(
        {
          $and: [{ _id: orderId }, { "orderItems.productId": productId }],
        },
        { $set: { "orderItems.$.orderStatus": orderStatus } }
      );
      console.log("updateResult:", updateResult, orderStatus);
      return updateResult;
    } catch (err) {
      console.log("Error:", err);
      throw err;
    }
  },
  getAllOrders: async (filter, page = 1, sales = null) => {
    try {
      const skip = Number(page) ? Number(page) - 1 : 0;
      const agg = [
        {
          $lookup: {
            from: "userdbs",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $lookup: {
            from: "uservariationdbs",
            localField: "userId",
            foreignField: "userId",
            as: "userVariations",
          },
        },
        {
          $sort: {
            orderDate: -1,
          },
        },
      ];

      if (filter && filter !== "All") {
        agg.splice(1, 0, {
          $match: {
            "orderItems.orderStatus": filter,
          },
        });
      }

      if (!sales) {
        agg.push(
          {
            $skip: 12 * skip,
          },
          {
            $limit: 12,
          }
        );
      }

      return await Orderdb.aggregate(agg);
    } catch (err) {
      throw err;
    }
  },
  addReferralOffer: async (body) => {
    try {
      const newReferralOffer = new ReferralOfferdb(body);
      return await newReferralOffer.save();
    } catch (err) {
      throw err;
    }
  },
  referralOffers: async (referralOfferId = null) => {
    try {
      if (referralOfferId) {
        return await ReferralOfferdb.findOne({ _id: referralOfferId });
      }
      return await ReferralOfferdb.find();
    } catch (err) {
      throw err;
    }
  },

  admintDeleteReferralOffer: async (referralOfferId) => {
    try {
      return await ReferralOfferdb.deleteOne({ _id: referralOfferId });
    } catch (err) {
      throw err;
    }
  },
  updateReferralOffer: async (referralOfferId, body) => {
    try {
      return await ReferralOfferdb.updateOne(
        { _id: referralOfferId },
        { $set: body }
      );
    } catch (err) {
      throw err;
    }
  },

  addCoupon: async (body) => {
    try {
      const newCoupon = new Coupondb(body);
      await newCoupon.save();
    } catch (err) {
      throw err;
    }
  },
  getAllCoupon: async (couponId = null, page = null) => {
    try {
      const skip = Number(page) ? Number(page) - 1 : 0;
      if (couponId) {
        if (!isObjectIdOrHexString(couponId)) {
          return null;
        }
        return await Coupondb.findOne({ _id: couponId });
      }
      return await Coupondb.find()
        .skip(12 * skip)
        .limit(12);
    } catch (err) {
      throw err;
    }
  },
  adminUpdateCoupon: async (couponId, body) => {
    try {
      return await Coupondb.updateOne({ _id: couponId }, body);
    } catch (err) {
      throw err;
    }
  },
  adminDeleteCoupon: async (couponId) => {
    try {
      return await Coupondb.deleteOne({ _id: couponId });
    } catch (err) {
      throw err;
    }
  },
  adminCheckIfCouponExist: async (code, couponId = false) => {
    try {
      if (couponId) {
        return await Coupondb.findOne({ _id: { $ne: couponId }, code });
      }
      return await Coupondb.findOne({ code });
    } catch (err) {
      throw err;
    }
  },

  saveOffer: async (body) => {
    try {
      const isOffer = await Offerdb.findOne({
        $or: [{ productName: body.productName }, { category: body.category }],
      });

      if (
        !isOffer ||
        (!body.productName && body.category !== isOffer.category) ||
        (!body.category && body.productName !== isOffer.productName)
      ) {
        const newOffer = new Offerdb(body);

        let query = {};
        if (newOffer.productName && !newOffer.category) {
          query = { pName: { $regex: newOffer.productName, $options: "i" } };
        }

        if (!newOffer.productName && newOffer.category) {
          query = { category: { $regex: newOffer.category, $options: "i" } };
        }

        if (newOffer.productName && newOffer.category) {
          query = {
            $or: [
              { pName: { $regex: newOffer.productName, $options: "i" } },
              { category: { $regex: newOffer.category, $options: "i" } },
            ],
          };
        }

        const pro = await Productdb.find(query);

        await Productdb.updateMany(query, { $push: { offers: newOffer._id } });
        return await newOffer.save();
      }
      const response = {
        err: true,
      };

      if (body.productName && isOffer.productName === body.productName) {
        response.productName = `This product already have an offer`;
      }

      if (body.category && isOffer.category === body.category) {
        response.category = `This category already have an offer`;
      }

      return response;
    } catch (err) {
      throw err;
    }
  },
  getOffer: async (offerId = null, page = null) => {
    try {
      if (!offerId) {
        const skip = Number(page) ? Number(page) - 1 : 0;
        return await Offerdb.find()
          .skip(skip * 12)
          .limit(12);
      }

      if (!isObjectIdOrHexString(offerId)) {
        return null;
      }

      return await Offerdb.findOne({ _id: offerId });
    } catch (err) {
      throw err;
    }
  },
  isOfferExist: async (offerId, body) => {
    try {
      const isOffer = await Offerdb.findOne({
        $and: [
          { _id: { $ne: offerId } },
          {
            $or: [
              { productName: body.productName },
              { category: body.category },
            ],
          },
        ],
      });

      if (
        !isOffer ||
        (!body.productName && body.category !== isOffer.category) ||
        (!body.category && body.productName !== isOffer.productName)
      ) {
        return {
          err: false,
        };
      }
      const response = {
        err: true,
      };

      if (body.productName && isOffer.productName === body.productName) {
        response.productName = `This product already have an offer`;
      }

      if (body.category && isOffer.category === body.category) {
        response.category = `This category already have an offer`;
      }

      return response;
    } catch (err) {
      throw err;
    }
  },
  updateOffer: async (offerId, body) => {
    try {
      return await Offerdb.updateOne({ _id: offerId }, { $set: body });
    } catch (err) {
      throw err;
    }
  },
  adminDeleteOffer: async (offerId) => {
    try {
      await Productdb.updateMany(
        {},
        { $pull: { offers: new mongoose.Types.ObjectId(offerId) } }
      );
      return await Offerdb.deleteOne({ _id: offerId });
    } catch (err) {
      throw err;
    }
  },
  adminPageNation: async (management, status = true) => {
    try {
      if (management === "OM") {
        const tOrdersNo = await Orderdb.aggregate([
          {
            $unwind: {
              path: "$orderItems",
            },
          },
        ]);

        return tOrdersNo.length;
      }

      if (management === "UM") {
        return await Userdb.countDocuments();
      }

      if (management === "CM") {
        return (await Categorydb.find({ status })).length;
      }

      if (management === "PM") {
        return (await Productdb.find({ unlistedProduct: status })).length;
      }

      if (management === "BM") {
        return (await bannerdb.find({ status })).length;
      }

      if (management === "CouponM") {
        return (await Coupondb.find()).length;
      }

      if (management === "OfferM") {
        return (await Offerdb.find()).length;
      }
    } catch (err) {
      throw err;
    }
  },
  getSingleOrder: async () => {
    try {
      const agg = [
        {
          $lookup: {
            from: "userdbs",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo",
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
          $lookup: {
            from: "offerdbs",
            localField: "pDetails.offers",
            foreignField: "_id",
            as: "allOffers",
          },
        },
        {
          $lookup: {
            from: "uservariationdbs",
            localField: "userId",
            foreignField: "userId",
            as: "userVariations",
          },
        },
        {
          $sort: {
            orderDate: -1,
          },
        },
      ];

      const orderDetails = await Orderdb.aggregate(agg);

      orderDetails.forEach((each) => {
        each.allOffers = each.allOffers.reduce((total, offer) => {
          if (offer.expiry >= new Date() && offer.discount > total) {
            return (total = offer.discount);
          }

          return total;
        }, 0);
      });

      return orderDetails;
    } catch (err) {
      throw err;
    }
  },

  getSalesReport: async (fromDate, toDate, full) => {
    try {
      const agg = [
        {
          $unwind: {
            path: "$orderItems",
          },
        },
        {
          $lookup: {
            from: "userdbs",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo",
          },
        },

        {
          $sort: {
            orderDate: -1,
          },
        },
      ];

      if (!full) {
        agg.splice(0, 0, {
          $match: {
            $and: [
              {
                orderDate: { $gte: new Date(fromDate) },
              },
              {
                orderDate: {
                  $lte: new Date(
                    new Date(toDate).getTime() + 1 * 24 * 60 * 60 * 1000
                  ),
                },
              },
            ],
          },
        });
      }

      return await Orderdb.aggregate(agg);
    } catch (err) {
      throw err;
    }
  },
};
