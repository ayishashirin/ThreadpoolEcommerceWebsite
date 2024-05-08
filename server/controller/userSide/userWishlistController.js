const userHelper = require('../../databaseHelpers/userHelper');

module.exports = {
    addToWishlist: async (req, res) => {
        try {
            await userHelper.addProductToWishList(req.session.isUserAuth, req.params.productId);

            return res.status(200).json({
                status: true,
                message: 'Item added to Wishlist'
            });
        } catch (err) {
            console.log("addToWhishlistErr",err);
            res.status(500).render("errorPages/500ErrorPage");
        }
    },
    deleteFromWishlist: async (req, res) => {
        try {
            await userHelper.removeWishlistItems(req.session.isUserAuth, req.params.productId);

            return res.status(200).json({
                status: true,
                message: 'Item removed from Wishlist'
            });
        } catch (err) {
            console.log("addToWhishlistErr",err);
            res.status(500).render("errorPages/500ErrorPage");
        }
    },
    userWishlistNow: async (req, res) => {
        try {
        
    
          console.log(req.params.productId);
    
          const isWishList = await wishlistdb.findOne({
            userId: req.session.isUserAuth,
            "products.productId": req.params.productId,
          });
    
          if (!isWishList) {
    
            await wishlistdb.updateOne(
              { userId: req.session.isUserAuth },
              { $push: { products: { productId: req.params.productId } } },
              { upsert: true }
            );
    
            return res.status(200).
            // redirect("/addToWishlist")
            json({
              message: 'Product added to wishlist',
              success: true,
              url: '/addToWishList'
            })
          } else {
            return res.status(200).json({
              message: 'Product already added',
              success: true
            })
          }
        } catch (err) {
          console.error(err);
          res.status(500).json({
            err
          })
        }
      },

      userWishlistItemUpdate: async (req, res) => {
        try {
          const wishlistProduct = await wishlistdb.findOne(
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
              wishlistProduct.products[0].quantity + values > stock.quantity
            ) {
              return res.json({
                message: `Only ${stock.quantity} stocks available `,
                result: false,
                stock: stock.quantity,
              });
            }
      
            if (values < 0 && wishlistProduct.products[0].quantity + values < 1) {
              return res.json({
                message: "Quantity cannot be less than 1",
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
      
            // User Helper function to get all products in the cart
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
              wishlistItems: wishlistItems, // Sending cartItems to frontend
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
      
       
        
      
    
}