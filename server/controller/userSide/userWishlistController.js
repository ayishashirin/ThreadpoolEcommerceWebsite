const userHelper = require("../../databaseHelpers/userHelper");
const ProductVariationdb =
  require("../../model/adminSide/productModel").ProductVariationdb;
const wishlistdb = require("../../model/userSide/wishlist");

module.exports = {
  userWishlistNow: async (req, res) => {
    try {
      const isWishList = await wishlistdb.findOne({
        userId: req.session.isUserAuth,
        "products.productId": req.params.productId,
      });

      if (!isWishList) {
        await wishlistdb.updateOne(
          { userId: req.session.isUserAuth },
          { $push: { products: { productId: req.params.productId } } },
          { upsert: true },
          { new: true }
        );

        return res.status(200).json({ success: true });
      } else {
        return res.status(200).redirect("/addToWishlist");
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({
        err,
      });
    }
  },

  userWishlistDelete: async (req, res) => {
    try {
      await wishlistdb.updateOne(
        { userId: req.session.isUserAuth },
        { $pull: { products: { productId: req.params.productId } } }
      );

      res.redirect("/addToWishlist");
    } catch (err) {
      console.error("cart Update err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  userWishlistDeleteAll: async (req, res) => {
    try {
      await wishlistdb.updateOne(
        { userId: req.session.isUserAuth },
        { $set: { products: [] } } 
      );

      res.redirect("/addToWishlist");
    } catch (err) {
      console.error("Cart update error:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  userWishlistItemUpdate: async (req, res) => {
    try {
      const product = await wishlistdb.findOne(
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
          product.products[0].quantity + values > stock.quantity
        ) {
          return res.json({
            message: `Only ${stock.quantity} stocks available `,
            result: false,
            stock: stock.quantity,
          });
        }

        const wishlistItem = await wishlistdb.updateOne(
          {
            userId: req.session.isUserAuth,
            "products.productId": req.params.productId,
          },
          { $inc: { "products.$.quantity": values } }
        );

        const wishlistItems = await userHelper.getWishlistItemsAll(
          req.session.isUserAuth
        );
        const discount = wishlistItems.reduce((total, value) => {
          const fPrice = value.pDetails[0].fPrice;
          const lPrice = value.pDetails[0].lPrice;
          const discountAmount = (fPrice - lPrice) * value.products.quantity;
          return total + discountAmount;
        }, 0);

        const total = wishlistItems.reduce((total, value) => {
          return (total += value.pDetails[0].lPrice * value.products.quantity);
        }, 0);

        return res.json({
          message: "Successful quantity update",
          result: true,
          total,
          discount,
          wishlistItems: wishlistItems, 
          wishlistItem,
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
};
