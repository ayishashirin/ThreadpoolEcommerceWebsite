const userVariationdb = require("../../model/userSide/userVariationModel");

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
module.exports = {
  userAddAddress: async (req, res) => {
    try {
      req.body.country = req.body.country?.trim();
      req.body.district = req.body.district?.trim();
      req.body.state = req.body.state?.trim();
      req.body.city = req.body.city?.trim();
      req.body.houseName = req.body.houseName;
      req.body.phoneNo = req.body.phoneNo?.trim();

      if (!req.body.name) {
        req.session.name = `This Field is required`;
      }

      if (!req.body.country) {
        req.session.country = `This Field is required`;
      }

      if (!req.body.district) {
        req.session.district = `This Field is required`;
      }

      if (!req.body.state) {
        req.session.state = `This Field is required`;
      }

      if (!req.body.city) {
        req.session.city = `This Field is required`;
      }

      if (!req.body.phoneNo) {
        req.session.phoneNo = `This Field is required`;
      }

      if (req.body.phoneNo && String(req.body.phoneNo).length !== 10) {
        req.session.phoneNo = `Invalid Phone Number`;
      }

      if (req.body.phoneNo && !/^[6-9]\d{9}$/.test(req.body.phoneNo)) {
        req.session.phoneNo = `Invalid Phone Number`;
      }

      if (!req.body.houseName) {
        req.session.houseName = `This Field is required`;
      }

      if (!req.body.pin) {
        req.session.pin = `This Field is required`;
      }

      if (
        req.session.pin ||
        req.session.phoneNo ||
        req.session.city ||
        req.session.state ||
        req.session.district ||
        req.session.country ||
        req.session.name ||
        req.session.name
      ) {
        req.session.sAddress = req.body;
        return res.status(401).redirect("/addAddress");
      }
      function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }
      req.body.name = capitalizeFirstLetter(req.body.name);
      req.body.country = capitalizeFirstLetter(req.body.country);
      req.body.district = capitalizeFirstLetter(req.body.district);
      req.body.state = capitalizeFirstLetter(req.body.state);
      req.body.city = capitalizeFirstLetter(req.body.city);
      req.body.houseName = capitalizeFirstLetter(req.body.houseName);

      const isAddress = await userVariationdb.findOne({
        userId: req.session.isUserAuth,
        "address.name": req.body.name,
        "address.country": req.body.country,
        "address.district": req.body.district,
        "address.state": req.body.state,
        "address.city": req.body.city,
        "address.phoneNo": req.body.phoneNo,
        "address.houseName": req.body.houseName,
        "address.pin": req.body.pin,
      });

      if (isAddress) {
        req.session.exist = `This address already exist`;
        req.session.sAddress = req.body;
        return res.status(401).redirect("/addAddress");
      }

      const structuredAddress = `${req.body.name},${req.body.houseName} - ${req.body.phoneNo},${req.body.city},${req.body.district},${req.body.state} - ${req.body.pin}`;

      await userVariationdb.updateOne(
        { userId: req.session.isUserAuth },
        {
          $push: {
            address: {
              name: req.body.name,
              country: req.body.country,
              district: req.body.district,
              state: req.body.state,
              city: req.body.city,
              houseName: req.body.houseName,
              phoneNo: req.body.phoneNo,
              pin: req.body.pin,
              structuredAddress,
            },
          },
        },
        { upsert: true }
      );

      const addres = await userVariationdb.findOne({
        userId: req.session.isUserAuth,
      });

      if (req.query.checkOut === "true") {
        addres.address.forEach(async (element) => {
          if (element.structuredAddress === structuredAddress) {
            await userVariationdb.updateOne(
              { userId: req.session.isUserAuth },
              { $set: { defaultAddress: element._id } }
            );
          }
        });
        return res.status(200).json(true);
      }

      if (!addres.defaultAddress || addres.address.length === 1) {
        await userVariationdb.updateOne(
          { userId: req.session.isUserAuth },
          { $set: { defaultAddress: addres.address[0]._id } }
        );
      }

      res.status(200).redirect("/editAddress");
    } catch (err) {
      console.error("err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  userChangeDefault: async (req, res) => {
    try {
      await userVariationdb.updateOne(
        { userId: req.session.isUserAuth },
        { $set: { defaultAddress: req.params.adId } }
      );
      res.status(200).redirect("/editAddress");
    } catch (err) {
      console.error(err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  deleteAddress: async (req, res) => {
    try {
      const address = await userVariationdb.findOneAndUpdate(
        { userId: req.session.isUserAuth },
        { $pull: { address: { _id: req.params.adId } } }
      );

      if (
        String(address.defaultAddress) === req.params.adId &&
        address.address.length > 1
      ) {
        const addres = await userVariationdb.findOne({
          userId: req.session.isUserAuth,
        });

        await userVariationdb.updateOne(
          { userId: req.session.isUserAuth },
          { $set: { defaultAddress: addres.address[0]._id } }
        );
      }
      res.status(200).redirect("/editAddress");
    } catch (err) {
      console.error("err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  userupdateAddress: async (req, res) => {
    try {
      req.body.country = req.body.country.trim();
      req.body.district = req.body.district.trim();
      req.body.state = req.body.state.trim();
      req.body.city = req.body.city.trim();
      req.body.houseName = req.body.houseName.trim();
      req.body.phoneNo = req.body.phoneNo.trim();

      if (!req.body.name) {
        req.session.name = `This Field is required`;
      }
      if (!req.body.country) {
        req.session.country = `This Field is required`;
      }
      if (!req.body.district) {
        req.session.district = `This Field is required`;
      }
      if (!req.body.state) {
        req.session.state = `This Field is required`;
      }
      if (!req.body.city) {
        req.session.city = `This Field is required`;
      }
      if (!req.body.phoneNo) {
        req.session.phoneNo = `This Field is required`;
      }
      if (!req.body.houseName) {
        req.session.houseName = `This Field is required`;
      }
      if (!req.body.pin) {
        req.session.pin = `This Field is required`;
      }
      if (req.body.pin.length !== 6) {
        req.session.pin = "PinCode must contain 6 numbers";
      }

      if (
        req.session.pin ||
        req.session.phoneNo ||
        req.session.city ||
        req.session.state ||
        req.session.district ||
        req.session.country ||
        req.session.name
      ) {
        req.session.sAddress = req.body;
        return res.status(401).redirect(`/editAddress/${req.query.adId}`);
      }

      req.body.name = capitalizeFirstLetter(req.body.name);
      req.body.country = capitalizeFirstLetter(req.body.country);
      req.body.district = capitalizeFirstLetter(req.body.district);
      req.body.state = capitalizeFirstLetter(req.body.state);
      req.body.city = capitalizeFirstLetter(req.body.city);
      req.body.houseName = capitalizeFirstLetter(req.body.houseName);

      const isAddress = await userVariationdb.findOne({
        userId: req.session.isUserAuth,
        "address.name": req.body.name,
        "address.country": req.body.country,
        "address.district": req.body.district,
        "address.state": req.body.state,
        "address.city": req.body.city,
        "address.phoneNo": req.body.phoneNo,
        "address.houseName": req.body.houseName,
        "address.pin": req.body.pin,
      });

      if (isAddress) {
        req.session.exist = `This address already exists`;
        return res.status(401).redirect(`/editAddress/${req.query.adId}`);
      }

      const structuredAddress = `${req.body.name}\n${req.body.houseName}-${req.body.phoneNo}\n${req.body.city}\n${req.body.district}\n${req.body.state} - ${req.body.pin}`;

      await userVariationdb.updateOne(
        { userId: req.session.isUserAuth, "address._id": req.query.adId },
        {
          $set: {
            "address.$.name": req.body.name,
            "address.$.country": req.body.country,
            "address.$.district": req.body.district,
            "address.$.state": req.body.state,
            "address.$.city": req.body.city,
            "address.$.houseName": req.body.houseName,
            "address.$.phoneNo": req.body.phoneNo,
            "address.$.pin": req.body.pin,
            "address.$.structuredAddress": structuredAddress,
          },
        }
      );

      res.status(200).redirect("/editAddress");
    } catch (err) {
      console.error(err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  changeAddressPayment: async (req, res) => {
    try {
      await userVariationdb.updateOne(
        { userId: req.session.isUserAuth },
        { $set: { defaultAddress: req.body.adId } }
      );
      if (req.session.isCartItem) {
        return res.status(200).redirect(`/cartCheckOut`);
      }
      res.status(200).redirect(`/cartCheckOut`);
    } catch (err) {
      console.error("payment err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
};
