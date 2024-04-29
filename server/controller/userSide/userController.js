const Userdb = require("../../model/userSide/userModel");
const Otpdb = require("../../model/userSide/otpModel");
const Productdb = require("../../model/adminSide/productModel").Productdb;
const ProductVariationdb = require("../../model/adminSide/productModel").ProductVariationdb;
const userVariationdb = require("../../model/userSide/userVariationModel");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const mongoose = require("mongoose");
const userHelper = require("../../databaseHelpers/userHelper");
const path = require("path");
const Cartdb = require("../../model/userSide/cartModel");
const usersAddToCart = require("../../services/userSide/userRender");
const saltRounds = 10; // Salt rounds for bcrypt
const orderdb = require("../../model/userSide/orderModel");
const shortid = require("shortid");
const wishlistdb = require("../../model/userSide/wishlist");
const Razorpay = require("razorpay");
const puppeteer = require("puppeteer-core");
const instance = new Razorpay({
                                  key_id: process.env.key_id,
                                  key_secret: process.env.key_secret,
                              });
// --OTP------------------------------------------------------------------------------------------------------

function capitalizeFirstLetter(str) {
  str = str.toLowerCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const deleteOtpFromdb = async (_id) => {
  await Otpdb.deleteOne({ _id });
};

const otpGenrator = () => {
  return `${Math.floor(1000 + Math.random() * 9000)}`;
};

const sendOtpMail = async (req, res, getRoute) => {
  const otp = otpGenrator();

  console.log(otp, "-------------------------------------------------");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS,
    },
  });

  const MailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Threadpool",
      link: "https://mailgen.js/",
      logo: "Threadpool",
    },
  });

  const response = {
    body: {
      name: req.session.verifyEmail,
      intro: "Your OTP for Threapool verification is:",
      table: {
        data: [
          {
            OTP: otp,
          },
        ],
      },
      outro: "Looking forward to doing more business",
    },
  };

  const mail = MailGenerator.generate(response);

  const message = {
    from: process.env.AUTH_EMAIL,
    to: req.session.verifyEmail,
    subject: "Threadpool OTP Verification",
    html: mail,
  };

  try {
    const newOtp = new Otpdb({
      email: req.session.verifyEmail,
      otp: otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
    });
    const data = await newOtp.save();
    req.session.otpId = data._id;
    res.status(200).redirect(getRoute);
    await transporter.sendMail(message);
  } catch (err) {
    console.error(err);
    res.status(500).render("errorPages/500ErrorPage");
  }
};

const userOtpVerify = async (req, res, getRoute) => {
  try {
    const data = await Otpdb.findOne({ _id: req.session.otpId });

    if (!data) {
      req.session.otpError = "OTP Expired";
      req.session.rTime = "0";
      return res.status(401).redirect(getRoute);
    }

    if (data.expiresAt < Date.now()) {
      req.session.otpError = "OTP Expired";
      req.session.rTime = "0";
      deleteOtpFromdb(req.session.otpId);
      return res.status(401).redirect(getRoute);
    }

    if (data.otp != req.body.otp) {
      req.session.otpError = "Wrong OTP";
      req.session.rTime = req.body.rTime;
      return res.status(401).redirect(getRoute);
    }

    return true;
  } catch (err) {
    console.error("Function error", err);
    res.status(500).render("errorPages/500ErrorPage");
  }
};

// -----------------------------------------------------------------------------------------------------------

module.exports = {
  userLogin: async (req, res) => {
    try {
      if (!req.body.email) {
        req.session.email = `This Field is required`;
      }

      if (!req.body.password) {
        req.session.password = `This Field is required`;
      }

      if (req.body.email && !/^[A-Za-z0-9]+@gmail\.com$/.test(req.body.email)) {
        req.session.email = `Not a valid Gmail address`;
      }

      if (req.session.email || req.session.password) {
        req.session.userInfo = req.body.email;
        return res.status(401).redirect("/login");
      }

      const data = await Userdb.findOne({ email: req.body.email });

      if (data) {
        if (bcrypt.compareSync(req.body.password, data.password)) {
          if (!data.userStatus) {
            req.session.userBlockedMesg = true;
            return res.status(200).redirect("/login");
          }
          req.session.isUserAuth = data._id;
          req.flash("toastMessage", "Signed in successfully");
          res.status(200).redirect("/"); //Login Sucessfull
          await Userdb.updateOne(
            { _id: data._id },
            { $set: { userLstatus: true } }
          );
        } else {
          req.session.userInfo = req.body.email;
          req.session.invalidUser = `Invalid credentials!`;
          res.status(401).redirect("/login"); //Wrong Password or email
        }
      } else {
        req.session.userInfo = req.body.email;
        req.session.invalidUser = `No user with that email`;
        res.status(401).redirect("/login"); //No user Found server err
      }
    } catch (err) {
      console.error(err);
      req.session.invalidUser = true;
      res.status(401).redirect("/login");
    }
  },

  // --------------------------------------------------------------------------------------------------------------------

  userRegister: async (req, res) => {
    try {
      req.body.fullName = req.body.fullName?.trim();
      req.body.phoneNumber = req.body.phoneNumber?.trim();
      req.body.password = req.body.password?.trim();
      req.body.confirmPassword = req.body.confirmPassword?.trim();
      req.body.email = req.body.email?.trim();

      // Validation checks
      const errors = {};

      if (!req.body.fullName) {
        errors.fName = "This field is required";
      } else {
        // Regular expression to match only capital and small letters
        const fullNameRegex = /^[a-zA-Z]+$/;
        if (!fullNameRegex.test(req.body.fullName)) {
          errors.fName = "Name must contain only capital and small letters";
        }
      }
      if (!req.body.phoneNumber) {
        errors.phone = "This Field is required";
      }
      if (!req.body.password) {
        errors.pass = "This Field is required";
      } else if (req.body.password.length < 6) {
        errors.pass = "Password must be at least 6 characters long";
      } else if (!/[A-Z]/.test(req.body.password)) {
        errors.pass = "Password must contain at least one uppercase letter";
      } else if (!/[!@#$%^&*()_+{}|:"<>?]/.test(req.body.password)) {
        errors.pass = "Password must contain at least one special character";
      }
      if (!req.body.confirmPassword) {
        errors.conPass = "This Field is required";
      }
      if (req.body.password !== req.body.confirmPassword) {
        errors.bothPass = "Both Passwords do not match";
      }
      if (!req.body.email) {
        errors.email = "This Field is required";
      }
      if (req.body.email && !/^[A-Za-z0-9]+@gmail\.com$/.test(req.body.email)) {
        errors.email = "Not a valid Gmail address";
      }

      if (req.body.phoneNumber && String(req.body.phoneNumber).length !== 10) {
        errors.phone = "Invalid Phonenumber";
      }
      if (req.body.phoneNumber && !/^[6-9]\d{9}$/.test(req.body.phoneNumber)) {
        errors.phone = "Invalid Phone Number";
      }

      const existingUser = await Userdb.findOne({
        $or: [{ phoneNumber: req.body.phoneNumber }, { email: req.body.email }],
      });

      if (existingUser) {
        if (existingUser.phoneNumber === req.body.phoneNumber) {
          errors.phone = "Phonenumber already taken";
        }
        if (existingUser.email === req.body.email) {
          errors.email = "Email already taken";
        }
      }

      if (Object.keys(errors).length > 0) {
        req.flash("userRegisterErrors", errors);
        const userRegisterFormData = {
          phone: req.body.phoneNumber,
          email: req.body.email,
          fName: req.body.fullName,
        };

        if(req.query.referralCode){
          return res.status(401).redirect(`/register?referralCode=${req.query.referralCode}`);
        }
        req.flash("userRegisterFormData", userRegisterFormData);
        return res.status(401).redirect("/register");
      }
      if (req.body.password === req.body.confirmPassword) {

      // Hash password
      const hashedPass = await bcrypt.hash(req.body.password, saltRounds);


      try {
        const isReferr = await userHelper.userRegisterWithOrWithoutRefferal(req.query);

        if(isReferr && (isReferr.referralCodeStatus === false)){
          return res.status(401).redirect(`/register?referralCode=${req.query.referralCode}`);
        }



      // Create new user
      const newUser = new Userdb({
        fullName: req.body.fullName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        password: hashedPass,
        userStatus: true,
        referralCode: shortid.generate()
      });
      console.log(newUser);

      await newUser.save();

      req.flash("userID", newUser._id);
     
      if(isReferr && (isReferr.referralCodeStatus === true)){
        newUser.referredBy = req.query.referralCode;
      }
      // Redirect to verify OTP page
      req.session.verifyOtpPage = true;
      req.session.verifyEmail = req.body.email;
      await sendOtpMail(req, res, "/registerOtpVerify");
    
    } catch (err) {
      console.error(err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  }

  
    } catch (err) {
      console.error(err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // ---------------------------------------------------------------------------------------------------------------------

  userRegisterEmailVerify: async (req, res) => {
    try {
      if (!req.body.email) {
        req.session.isUser = `This Field is required`;
      }

      if (req.body.email && !/^[A-Za-z0-9]+@gmail\.com$/.test(req.body.email)) {
        req.session.isUser = `Not a valid Gmail address`;
      }

      if (req.session.isUser) {
        return res.status(401).redirect("/userRegisterEmailVerify");
      }

      const data = await Userdb.findOne({ email: req.body.email });

      if (data) {
        req.session.isUser = `Email already in use`;
        return res.status(401).redirect("/userRegisterEmailVerify");
      }

      req.session.verifyOtpPage = true;
      req.session.verifyEmail = req.body.email;

      await sendOtpMail(req, res, "/registerOtpVerify");
    } catch (err) {
      console.error("Error querying the database:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // -----------------------------------------------------------------------------------------------------------

  userLoginEmailVerify: async (req, res) => {
    try {
      if (!req.body.email) {
        req.session.emailError = `This Field is required`;
      }

      if (req.body.email && !/^[A-Za-z0-9]+@gmail\.com$/.test(req.body.email)) {
        req.session.emailError = `Not a valid Gmail address`;
      }

      if (req.session.emailError) {
        return res.status(401).redirect("/forgotPassword");
      }
      const data = await Userdb.findOne({ email: req.body.email });

      if (!data) {
        req.session.emailError = "No user with that email";
        return res.status(401).redirect("/forgotPassword");
      }

      req.session.userId = data._id;
      req.session.verifyEmail = req.body.email;

      await sendOtpMail(req, res, "/forgotPassword"); // send otp as mail
    } catch (err) {
      console.error("Error querying the database:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // ------------------------------------------------------------------------------------------------------------

  userRegisterOtpVerify: async (req, res) => {
    try {
      console.log("hgfasdfgsdfghj");
      if (!req.body.otp) {
        req.session.otpError = `This Field is required`;
      }
      console.log("asdfghjertyui");
      if (String(req.body.otp).length != 4) {
        req.session.otpError = `Enter valid number`;
      }

      if (req.session.otpError) {
        req.session.rTime = req.body.rTime;
        return res.status(200).redirect("/registerOtpVerify");
      }
      const response = await userOtpVerify(req, res, "/registerOtpVerify");

      if (response) {
        deleteOtpFromdb(req.session.otpId);
        const userId = req.flash("userID")[0];
        req.session.isUserAuth = userId;
        res.status(200).redirect("/");
      }
    } catch (err) {
      console.error("Internal delete error", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // --------------------------------------------------------------------------------------------------------

  userLoginOtpVerify: async (req, res) => {
    try {
      if (!req.body.otp) {
        req.session.otpError = `This Field is required`;
      }

      if (String(req.body.otp).length > 4) {
        req.session.otpError = `Enter valid number`;
      }

      if (req.session.otpError) {
        req.session.rTime = req.body.rTime;
        return res.status(200).redirect("/forgotPassword");
      }

      const response = await userOtpVerify(req, res, "/forgotPassword");

      if (response) {
        deleteOtpFromdb(req.session.otpId);
        req.session.resetPasswordPage = true;

        delete req.session.verifyEmail;
        res.status(200).redirect("/loginResetPassword");
      }
    } catch (err) {
      console.error("Internal delete error", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // ---------------------------------------------------------------------------------------------------------------

  userRegisterEmailVerifyResend: async (req, res) => {
    try {
      deleteOtpFromdb(req.session.otpId);
      sendOtpMail(req, res, "/registerOtpVerify");

      delete req.session.otpError;
      delete req.session.rTime;
    } catch (err) {
      console.error("Resend Mail err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // -------------------------------------------------------------------------------------------------------

  userLoginResetPass: async (req, res) => {
    try {
      if (!req.body.newPassword) {
        req.session.newPass = `This Field is required`;
      }

      if (!req.body.confirmPassword) {
        req.session.conPass = `This Field is required`;
      }

      if (req.body.newPassword != req.body.confirmPassword) {
        req.session.errMesg = `Both passwords doesn't Match`;
      }

      if (req.body.newPassword && !/[a-z]/.test(req.body.newPassword)) {
        req.session.newPass = `Password at least contain one lowercase letter`;
      }

      if (req.body.newPassword && !/[A-Z]/.test(req.body.newPassword)) {
        req.session.newPass = `Password at least contain one uppercase letter`;
      }

      if (req.body.newPassword && !/\d/.test(req.body.newPassword)) {
        req.session.newPass = `Password at least contain one digit.`;
      }

      if (req.body.newPassword && !/[@$!%*?&]/.test(req.body.newPassword)) {
        req.session.newPass = `Password at least contain one special character from the provided set.`;
      }

      if (
        req.body.newPassword &&
        !/[A-Za-z\d@$!%*?&]{8,}/.test(req.body.newPassword)
      ) {
        req.session.newPass = `Password must be 8 charater long and contain letters, digits, and special characters`;
      }

      if (req.session.newPass || req.session.conPass || req.session.errMesg) {
        return res.status(200).redirect("/loginResetPassword");
      }

      const newHashedPass = bcrypt.hashSync(req.body.newPassword, 10);

      await Userdb.updateOne(
        { _id: req.session.userId },
        {
          $set: {
            password: newHashedPass,
          },
        }
      );

      delete req.session.userId;
      delete req.session.resetPasswordPage;

      res.status(200).redirect("/login");
    } catch (err) {
      console.error("Update query err:", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // -----------------------------------------------------------------------------------------------------------

  userUpdateAccount: async (req, res) => {
    try {
      req.body.fName = req.body.fName.trim();
      req.body.email = req.body.email.trim();
      req.body.oldPass = req.body.oldPass.trim();
      req.body.password = req.body.password.trim();
      req.body.cPass = req.body.cPass.trim();

      if (!req.body.fName) {
        req.session.fName = `This Field is required`;
      }

      if (!req.body.email) {
        req.session.email = `This Field is required`;
      }

      if (req.body.email && !/^[A-Za-z0-9]+@gmail\.com$/.test(req.body.email)) {
        req.session.email = `Not a valid Gmail address`;
      }

      if (!req.body.phone) {
        req.session.phone = `This Field is required`;
      }

      if (
        req.body.phone &&
        (String(req.body.phone).length < 10 ||
          String(req.body.phone).length > 10)
      ) {
        req.session.phone = `Not a Valid Number`;
      }

      if (req.body.oldPass || req.body.password || req.body.cPass) {
        if (!req.body.oldPass) {
          req.session.oldPass = `This Field is required`;
        }

        if (!req.body.password) {
          req.session.password = `This Field is required`;
        }

        if (!req.body.cPass) {
          req.session.cPass = `This Field is required`;
        }

        if (req.body.password !== req.body.cPass) {
          req.session.cPass = `Both Password doesn't Match`;
        }

        if (req.body.password) {
          if (!/[a-z]/.test(req.body.password)) {
            req.session.password = `Password at least contain one lowercase letter`;
          }

          if (!/[A-Z]/.test(req.body.password)) {
            req.session.password = `Password at least contain one uppercase letter`;
          }

          if (!/\d/.test(req.body.password)) {
            req.session.password = `Password at least contain one digit.`;
          }

          if (!/[@$!%*?&]/.test(req.body.password)) {
            req.session.password = `Password at least contain one special character from the provided set.`;
          }

          if (!/[A-Za-z\d@$!%*?&]{8,}/.test(req.body.password)) {
            req.session.password = `Password must be 8 charater long and contain letters, digits, and special characters`;
          }
        }
      }

      if (req.body.oldPass && req.body.password && req.body.cPass) {
        const userInfo = await Userdb.findOne({ _id: req.session.isUserAuth });
        if (!bcrypt.compareSync(req.body.oldPass, userInfo.password)) {
          req.session.oldPass = `Incorrect Password`;
        }
      }

      if (
        req.session.fName ||
        req.session.email ||
        req.session.phone ||
        req.session.oldPass ||
        req.session.password ||
        req.session.cPass
      ) {
        req.session.savedInfo = {
          fName: req.body.fName,
          email: req.body.email,
          phone: req.body.phone,
        };
        return res.status(401).redirect("/updateAccount");
      }

      const userInfo = await Userdb.findOne({ _id: req.session.isUserAuth });

      if (userInfo.email !== req.body.email) {
        // write the logic code to send otp and verify otp to proced
      }

      if (req.body.oldPass) {
        const hashedPass = bcrypt.hashSync(req.body.password, 10);

        const uUser = {
          fullName: req.body.fName,
          phoneNumber: req.body.phone,
          email: req.body.email,
          password: hashedPass,
        };

        await Userdb.updateOne(
          { _id: req.session.isUserAuth },
          { $set: uUser }
        );
      } else {
        const uUser = {
          fullName: req.body.fName,
          phoneNumber: req.body.phone,
          email: req.body.email,
        };

        await Userdb.updateOne(
          { _id: req.session.isUserAuth },
          { $set: uUser }
        );
      }

      res.status(200).redirect("/account");
    } catch (err) {
      console.error(err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // ----------------------------------------------------------------------------------------------------

  userLogOut: async (req, res) => {
    try {
      await Userdb.updateOne(
        { _id: req.session.isUserAuth },
        { $set: { userLstatus: false } }
      );

      req.session.destroy();

      res.status(200).redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  // --------------------------------------------------------------------------------------------------------

  userCartNow: async (req, res) => {
    try {
      console.log("kjhjhghgfgfd");

      console.log(req.params.productId);

      const isCart = await Cartdb.findOne({
        userId: req.session.isUserAuth,
        "products.productId": req.params.productId,
      });

      if (!isCart) {
        console.log("jjjjjjjjeeeee");

        await Cartdb.updateOne(
          { userId: req.session.isUserAuth },
          { $push: { products: { productId: req.params.productId } } },
          { upsert: true }
        );

        return res.status(200).redirect("/addToCart")
      } else {
        return res.status(200).redirect("/category")
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({
        err
      })
    }
  },

  userCartDelete: async (req, res) => {
    try {
      await Cartdb.updateOne(
        { userId: req.session.isUserAuth },
        { $pull: { products: { productId: req.params.productId } } }
      );

      res.redirect("/addToCart");
    } catch (err) {
      console.error("cart Update err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

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

 
  // -----------------------------------------------------------------------------------------------------

  userUpdateAccount: async (req, res) => {
    try {
      req.body.fName = req.body.fName.trim();
      req.body.email = req.body.email.trim();
      req.body.oldPass = req.body.oldPass.trim();
      req.body.password = req.body.password.trim();
      req.body.cPass = req.body.cPass.trim();

      if (!req.body.fName) {
        req.session.fName = `This Field is required`;
      }

      if (!req.body.email) {
        req.session.email = `This Field is required`;
      }

      if (req.body.email && !/^[A-Za-z0-9]+@gmail\.com$/.test(req.body.email)) {
        req.session.email = `Not a valid Gmail address`;
      }

      if (!req.body.phone) {
        req.session.phone = `This Field is required`;
      }

      if (
        req.body.phone &&
        (String(req.body.phone).length < 10 ||
          String(req.body.phone).length > 10)
      ) {
        req.session.phone = `Not a Valid Number`;
      }

      if (req.body.oldPass || req.body.password || req.body.cPass) {
        if (!req.body.oldPass) {
          req.session.oldPass = `This Field is required`;
        }

        if (!req.body.password) {
          req.session.password = `This Field is required`;
        }

        if (!req.body.cPass) {
          req.session.cPass = `This Field is required`;
        }

        if (req.body.password !== req.body.cPass) {
          req.session.cPass = `Both Password doesn't Match`;
        }

        if (req.body.password) {
          if (!/[a-z]/.test(req.body.password)) {
            req.session.password = `Password at least contain one lowercase letter`;
          }

          if (!/[A-Z]/.test(req.body.password)) {
            req.session.password = `Password at least contain one uppercase letter`;
          }

          if (!/\d/.test(req.body.password)) {
            req.session.password = `Password at least contain one digit.`;
          }

          if (!/[@$!%*?&]/.test(req.body.password)) {
            req.session.password = `Password at least contain one special character from the provided set.`;
          }

          if (!/[A-Za-z\d@$!%*?&]{6,}/.test(req.body.password)) {
            req.session.password = `Password must be 6 charater long and contain letters, digits, and special characters`;
          }
        }
      }

      if (req.body.oldPass && req.body.password && req.body.cPass) {
        const userInfo = await Userdb.findOne({ _id: req.session.isUserAuth });
        if (!bcrypt.compareSync(req.body.oldPass, userInfo.password)) {
          req.session.oldPass = `Incorrect Password`;
        }
      }

      if (
        req.session.fName ||
        req.session.email ||
        req.session.phone ||
        req.session.oldPass ||
        req.session.password ||
        req.session.cPass
      ) {
        req.session.savedInfo = {
          fName: req.body.fName,
          email: req.body.email,
          phone: req.body.phone,
        };
        return res.status(401).redirect("/updateAccount");
      }

      const userInfo = await Userdb.findOne({ _id: req.session.isUserAuth });

      if (userInfo.email !== req.body.email) {
        // write the logic code to send otp and verify otp to proced
      }

      if (req.body.oldPass) {
        const hashedPass = bcrypt.hashSync(req.body.password, 10);

        const uUser = {
          fullName: req.body.fName,
          phoneNumber: req.body.phone,
          email: req.body.email,
          password: hashedPass,
        };

        await Userdb.updateOne(
          { _id: req.session.isUserAuth },
          { $set: uUser }
        );
      } else {
        const uUser = {
          fullName: req.body.fName,
          phoneNumber: req.body.phone,
          email: req.body.email,
        };

        await Userdb.updateOne(
          { _id: req.session.isUserAuth },
          { $set: uUser }
        );
      }

      res.status(200).redirect("/account");
    } catch (err) {
      console.error(err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },
  userAddAddress: async (req, res) => {
    try {
      req.body.name = req.body.name.trim();
      req.body.country = req.body.country.trim();
      req.body.district = req.body.district.trim();
      req.body.state = req.body.state.trim();
      req.body.city = req.body.city.trim();
      req.body.houseName = req.body.houseName.trim();

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

      if (!req.body.houseNo) {
        req.session.houseNo = `This Field is required`;
      }
      if (!req.body.houseName) {
        req.session.houseName = `This Field is required`;
      }

      if (!req.body.pin) {
        req.session.pin = `This Field is required`;
      }

      if (
        req.session.pin ||
        req.session.houseNo ||
        req.session.city ||
        req.session.state ||
        req.session.district ||
        req.session.country ||
        req.session.name
      ) {
        req.session.sAddress = req.body;
        return res.status(401).redirect("/addAddress");
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
        "address.houseNo": req.body.houseNo,
        "address.houseName": req.body.houseName,
        "address.pin": req.body.pin,
      });

      if (isAddress) {
        req.session.exist = `This address already exist`;
        req.session.sAddress = req.body;
        return res.status(401).redirect("/addAddress");
      }

      const structuredAddress = `\n${req.body.name},\n${req.body.houseName}-${req.body.houseNo},\n${req.body.city},\n${req.body.district},\n${req.body.state} - ${req.body.pin}`;

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
              houseNo: req.body.houseNo,
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
      req.body.name = req.body.name.trim();
      req.body.country = req.body.country.trim();
      req.body.district = req.body.district.trim();
      req.body.state = req.body.state.trim();
      req.body.city = req.body.city.trim();
      req.body.houseName = req.body.houseName.trim();

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

      if (!req.body.houseNo) {
        req.session.houseNo = `This Field is required`;
      }
      if (!req.body.houseName) {
        req.session.houseName = `This Field is required`;
      }

      if (!req.body.pin) {
        req.session.pin = `This Field is required`;
      }

      if (
        req.session.pin ||
        req.session.houseNo ||
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
        "address.houseNo": req.body.houseNo,
        "address.houseName": req.body.houseName,
        "address.pin": req.body.pin,
      });

      if (isAddress) {
        req.session.exist = `This address already exist`;
        return res.status(401).redirect(`/editAddress/${req.query.adId}`);
      }

      const structuredAddress = `${req.body.name},\n${req.body.houseName}- ${req.body.houseNo}, \n ${req.body.district},\n ${req.body.city},\n ${req.body.state} - ${req.body.pin}`;

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
            "address.$.houseNo": req.body.houseNo,
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



  userCartCheckOut : async (req, res) => {
    try {

      console.log('hiii');
      console.log(req.body);
      if (!req.body.adId) {
        req.session.adErr = `Choose an Address`;
      }

      if (!req.body.paymentMethode) {
        req.session.payErr = `Choose a payment Methode`;
      }

      const address = req.body.adId
        ? await userVariationdb.findOne(
            { userId: req.session.isUserAuth, "address._id": req.body.adId },
            { "address.$": 1, _id: 0 }
          )
        : null;

      if (!address && req.body.adId) {
        req.session.adErr = `Invalid address Choose an Address`;
      }

    



      const isCart = true; 
      let cartItems ;
      if (isCart) {
        // Assuming there's a cart, proceed with checking cart items
         cartItems = await Cartdb.findOne({
          userId: req.session.isUserAuth
        });
      }
      console.log(cartItems);
  
      if (cartItems) {
        for (let i = 0; i < cartItems?.length; i++) {
          const product = await Productdb.findOne({ _id: cartItems.products[i].productId });
          if (product.stock < cartItems.quantity) {
            return res.status(404).json({ success: false, message: "Out of Stock" });
          }
        }
      }
      
      const cartItemsDetails = await userHelper.getOrderItemsAll(
        req.session.isUserAuth
      );
      console.log(cartItemsDetails);

     const orderItems = cartItemsDetails.map((element) => {
      return {
        productId: element.pDetails[0]._id,
        pName: element.pDetails[0].pName,
        category: element.pDetails[0].category,
        pDescription: element.pDetails[0].pDescription,
        quantity: element.products.quantity,
        DiscountAmount: Math.round(((element.pDetails[0].fPrice)-(element.pDetails[0].lPrice)) * element.products.quantity),
        fPrice: element.pDetails[0].fPrice,
        lPrice: element.pDetails[0].lPrice,
        color: element.variations[0].color,
        images: element.variations[0].images[0],
        size: element.variations[0].size,
        orderStatus:"Ordered",
      };
    
    
    })

    let totalPrice = 0;
    orderItems.forEach(async (element) => {
      totalPrice += (element.quantity * element.lPrice) ;
    });
    console.log(totalPrice);
    const newOrder = new orderdb({
      userId: req.session.isUserAuth,
      orderItems: orderItems,
      address: address.address[0].structuredAddress,
      paymentMethode : (req.body.paymentMethode === "COD" ? "COD" : (req.body.paymentMethode === "paypal" ? "paypal" : "wallet")),
      totalPrice : totalPrice,
      orderDate:Date.now(),     
    })

    newOrder.orderItems.forEach(async (product) => {
      await ProductVariationdb.updateOne(
        { productId: product.id},
        { $inc: { quantity: (-1 * product.quantity) } }
      );
    });

    if(req.body.paymentMethode == "COD"){
      await newOrder.save();
      await Cartdb.updateOne(
        {userId:req.session.isUserAuth},
        {$set:{products:[]}}
      );

      return res.json({

      url:"/orderSuccessfull",
      paymentMethode:"COD"

      })

    }

    else if (req.body.paymentMethode == "paypal"){
      await newOrder.save();
      await Cartdb.updateOne(
        {userId:req.session.isUserAuth},
        {$set:{products:[]}}
      );

      return res.json({

      url:"/orderSuccessfull",
      paymentMethode:"paypal"

      })

    }
    else if (req.body.paymentMethode == "wallet")
    {
      await newOrder.save();
      await Cartdb.updateOne(
        {userId:req.session.isUserAuth},
        {$set:{products:[]}}
      );

      return res.json({

      url:"/orderSuccessfull",
      paymentMethode:"wallet"

      })

    }

  }catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  },

  userOrderCancel: async (req, res) => {
    try {
      //Helper fn to cancel order and update quantity back

      await userHelper.userOrderCancel(req.params.orderId, req.params.productId, req.session.isUserAuth);

      return res.status(200).redirect("/orders");
    } catch (err) {
      console.error("order Cancel err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  isCouponValidCart: async (req, res) => {
    try {
      const coupon = await userHelper.getCoupon(req.body.code);

      if(!coupon){
        return res.status(401).json({
          err: true,
          reload: false,
          message: 'Invalid coupon code'
        });
      }

      if(new Date(coupon.expiry) < new Date()){
        return res.status(401).json({
          err: true,
          reload: false,
          message: 'Coupon expired'
        });
      }

      if(coupon.count <= 0){
        return res.status(401).json({
          err: true,
          reload: false,
          message: `This coupon is Expired`
        });
      }

      //user Helper fn to get product all product in cart
      const cartItems = await userHelper.getCartItemsAll(req.session.isUserAuth);
      let minPriceErr = false;

      const totalDiscount = cartItems.reduce((total, value, i) => {
        if(((value.pDetails[0].category === coupon.category) || (coupon.category === 'All')) && (value.pDetails[0].lPrice >= coupon.minPrice)){
          return total += Math.round((value.pDetails[0].lPrice * value.products.quantity * coupon.discount) / 100);
        }

        if((value.pDetails[0].lPrice < coupon.minPrice)){
          minPriceErr = true;
        }

        return total;
      }, 0);

      if(!totalDiscount && minPriceErr){
        return res.status(401).json({
          err: true,
          reload: false,
          message: `This coupon is for products greater than or equal to ₹${coupon.minPrice}`
        });
      }

      if(!totalDiscount){
        return res.status(401).json({
          err: true,
          reload: false,
          message: `This coupon is for ${coupon.category} category`
        });
      }

      const total = cartItems.reduce((total, value) => {
          return total += Math.round((value.pDetails[0].lPrice * value.products.quantity));
      }, 0);

      res.status(200).json({
        status: true,
        totalDiscount,
        coupon,
        total
      });
    } catch (err) {
      console.error("isCoupon cart err", err);
      res.status(500).json({
        err: true,
        reload: true,
        message:"errorPages/500ErrorPage"
      });
    }
  },


  userWishListNow: async (req, res) => {
    try {
    

      console.log(req.params.productId);

      const isWishList = await wishlistdb.findOne({
        userId: req.session.isUserAuth,
        "products.productId": req.params.productId,
      });

      if (!isWishList) {
        console.log("jjjjjjjjeeeee");

        await wishlistdb.updateOne(
          { userId: req.session.isUserAuth },
          { $push: { products: { productId: req.params.productId } } },
          { upsert: true }
        );

        return res.status(200).json({
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

  onlinePaymentSuccessfull: async (req, res) => {
    try {
      const crypto = require("crypto");

      const hmac = crypto.createHmac("sha256", process.env.key_secret);
      hmac.update(
        req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id
      );

      if (hmac.digest("hex") === req.body.razorpay_signature) {
        const newOrder = new orderdb(req.session.newOrder);
        await newOrder.save();
        if (req.session.isCartItem) {
          await Cartdb.updateOne(
            { userId: req.session.isUserAuth },
            { $set: { products: [] } }
          ); // empty cart items
        }
        req.session.orderSucessPage = true;
        return res.status(200).redirect("/orderSuccessfull");
      } else {
        return res.send("Order Failed");
      }
    } catch (err) {
      console.error("order razorpay err", err);
      res.status(500).render("errorPages/500ErrorPage");
    }
  },

  userOrderDownloadInvoice: async (req, res) => {
    const browser = await puppeteer.launch({ 
      headless: "new",
      executablePath: '/snap/bin/chromium',
   });
    try {
      const isOrder = await userHelper.isOrdered(
        req.params.productId,
        req.session.isUserAuth,
        req.params.orderId
      );

      if (!isOrder) {
        return res.status(401).redirect("/orders");
      }
      const user = await userHelper.userInfo(req.session.isUserAuth);

      const address = user.variations[0].address.find((value) => {
        return String(value._id) === String(user.variations[0].defaultAddress);
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
          offerDiscountAmount: (value.offerDiscountAmount) * -1,
        };

        products.push(singleProduct);
      });

      const data = {
        client: {
          name: user.fullName,
          address: address.structuredAddress,
          phoneNumber: user.phoneNumber,
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
