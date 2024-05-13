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

const instance = new Razorpay({
                                  key_id: process.env.key_id,
                                  key_secret: process.env.key_secret,
                              });

                       
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

  // ------------------------------------------------------------------------------------------------------
};
