const userHelper = require("../../databaseHelpers/userHelper");
const path = require("path");

module.exports = {
  userOrderCancel: async (req, res) => {
    try {
      //Helper fn to cancel order and update quantity back

      await userHelper.userOrderCancel(
        req.params.orderId,
        req.params.productId,
        req.session.isUserAuth
      );

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("order Cancel err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  userOrderDownloadInvoice: async (req, res) => {
    try {
      const isOrder = await userHelper.isOrdered(
        req.params.productId,
        req.session.isUserAuth,
        req.params.orderId
      );

      if (!isOrder) {
        return res.status(401).redirect("/orders");
      }
      const userInfo = await userHelper.userInfo(req.session.isUserAuth);

      const address = userInfo.variations[0].address.find((value) => {
        return (
          String(value._id) === String(userInfo.variations[0].defaultAddress)
        );
      });

      const products = [];

      isOrder.orderItems.forEach((value) => {
        const singleProduct = {
          quantity: value.quantity,
          category: value.category,
          name: value.pName,
          amount: value.fPrice,
          price: value.lPrice,
          discounts: (value.fPrice - value.lPrice) * -1,
          couponDiscountAmount: Math.round(value.couponDiscountAmount) * -1,
          offerDiscountAmount: value.offerDiscountAmount * -1,
        };

        products.push(singleProduct);
      });

      const data = {
        client: {
          name: userInfo.fullName,
          address: address.structuredAddress,
          phoneNumber: userInfo.phoneNumber,
        },
        information: {
          orderId: isOrder._id,
          date: isOrder.orderDate
            .toISOString()
            .split("T")[0]
            .split("-")
            .reverse()
            .join("-"),
          orderDate: isOrder.orderDate
            .toISOString()
            .split("T")[0]
            .split("-")
            .reverse()
            .join("-"),
        },
        products,
      };

      const customTemplate = fs.readFileSync(
        path.join(__dirname, "../../../views/userSide/invoice.ejs"),
        "utf-8"
      );
      const renderedTemplate = ejs.render(customTemplate, { data });

      const page = await browser.newPage();

      await page.setContent(renderedTemplate);

      const pdfBuffer = await page.pdf({
        format: "A4",
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");

      res.status(200).send(pdfBuffer);
    } catch (err) {
      console.error("isOrder err", err);
      res.status(500).render("errorPages/500ErrorPage");
    } finally {
      await browser.close();
    }
  },
};
