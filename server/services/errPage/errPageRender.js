const userHelper = require("../../databaseHelpers/userHelper");

module.exports = {
  errPage: async (req, res) => {
    try {
      if (req.session.adminPageErr) {
        return res.status(404).render("errorPages/admin404Page");
      }


      const category = await userHelper.getAllListedCategory();
      const wishlistItems = await userHelper.getWishlistItemsAll(
        req.session.isUserAuth
      );

      const userInfo = await userHelper.userInfo(req.session.isUserAuth);

      const cartItems = await userHelper.getCartItemsAll(
        req.session.isUserAuth
      );

      const counts = await userHelper.getTheCountOfWhislistCart(
        req.session.isUserAuth
      );

      res
        .status(404)
        .render("errorPages/user404Page", {
          category,
          user: req.session.isUserAuth,
          counts,
          cartItems,
          userInfo,
          wishlistItems,
        });
    } catch (err) {
      console.error("errPage err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
};
