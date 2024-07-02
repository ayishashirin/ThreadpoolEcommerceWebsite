const adminEmail = process.env.adminEmail;
const adminPassword = process.env.adminPass;
const Userdb = require("../../model/userSide/userModel");
const path = require("path");
const adminHelper = require("../../databaseHelpers/adminHelper");
const Orderdb = require("../../model/userSide/orderModel");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const fs = require("fs");
const CsvParser = require("json2csv").Parser;

function capitalizeFirstLetter(str) {
  str = str.toLowerCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  adminLogin: (req, res) => {
    if (!req.body.email) {
      req.session.adminEmail = `This Field is required`;
    }

    if (!req.body.password) {
      req.session.adminPassword = `This Field is required`;
    }

    if (req.body.email && !/^[A-Za-z0-9]+@gmail\.com$/.test(req.body.email)) {
      req.session.adminEmail = `Not a valid Gmail address`;
    }

    if (req.session.adminEmail || req.session.adminPassword) {
      return res.status(401).redirect("/adminLogin");
    }
    if (req.body.password === adminPassword && req.body.email === adminEmail) {
      req.session.isAdminAuth = true;
      res.status(200).redirect("/adminHome");
    } else {
      req.session.invalidAdmin = `Invalid credentials!`;
      res.status(401).redirect("/adminLogin");
    }
  },

  getDetailsChart: async (req, res) => {
    try {
      let labelObj = {};
      let salesCount;
      let findQuerry;
      let currentYear;
      let currentMonth;
      let index;

      switch (req.body.filter) {
        case "Weekly":
          currentYear = new Date().getFullYear();
          currentMonth = new Date().getMonth() + 1;

          labelObj = {
            Sun: 0,
            Mon: 1,
            Tue: 2,
            Wed: 3,
            Thu: 4,
            Fri: 5,
            Sat: 6,
          };

          salesCount = new Array(7).fill(0);

          findQuerry = {
            orderDate: {
              $gte: new Date(currentYear, currentMonth - 1, 1),
              $lte: new Date(currentYear, currentMonth, 0, 23, 59, 59),
            },
          };
          index = 0;
          break;
        case "Monthly":
          currentYear = new Date().getFullYear();
          labelObj = {
            Jan: 0,
            Feb: 1,
            Mar: 2,
            Apr: 3,
            May: 4,
            Jun: 5,
            Jul: 6,
            Aug: 7,
            Sep: 8,
            Oct: 9,
            Nov: 10,
            Dec: 11,
          };

          salesCount = new Array(12).fill(0);

          findQuerry = {
            orderDate: {
              $gte: new Date(currentYear, 0, 1),
              $lte: new Date(currentYear, 11, 31, 23, 59, 59),
            },
          };
          index = 1;
          break;
        case "Daily":
          currentYear = new Date().getFullYear();
          currentMonth = new Date().getMonth() + 1;
          let end = new Date(currentYear, currentMonth, 0, 23, 59, 59);
          end = String(end).split(" ")[2];
          end = Number(end);

          for (let i = 0; i < end; i++) {
            labelObj[`${i + 1}`] = i;
          }

          salesCount = new Array(end).fill(0);

          findQuerry = {
            orderDate: {
              $gt: new Date(currentYear, currentMonth - 1, 1),
              $lte: new Date(currentYear, currentMonth, 0, 23, 59, 59),
            },
          };

          index = 2;
          break;
        case "Yearly":
          findQuerry = {};

          const ord = await Orderdb.find().sort({ orderDate: 1 });
          const stDate = ord[0].orderDate.getFullYear();
          const endDate = ord[ord.length - 1].orderDate.getFullYear();

          for (let i = 0; i <= Number(endDate) - Number(stDate); i++) {
            labelObj[`${stDate + i}`] = i;
          }

          salesCount = new Array(Object.keys(labelObj).length).fill(0);

          index = 3;
          break;
        default:
          return res.json({
            label: [],
            salesCount: [],
          });
      }

      const orders = await Orderdb.find(findQuerry);

      orders.forEach((order) => {
        if (index === 2) {
          salesCount[
            labelObj[
              Number(
                order.orderDate.toISOString().split("-")[index].split("T")[0]
              )
            ]
          ] += 1;
        } else {
          salesCount[labelObj[String(order.orderDate).split(" ")[index]]] += 1;
        }
      });

      res.json({
        label: Object.keys(labelObj),
        salesCount,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("Internal server err");
    }
  },

  adminUserStatus: async (req, res) => {
    if (!Number(req.params.block)) {
      await Userdb.updateOne(
        { _id: req.params.id },
        { $set: { userStatus: false, userLstatus: false } }
      );
      return res.status(200).redirect("/adminUserManagement");
    }
    await Userdb.updateOne(
      { _id: req.params.id },
      { $set: { userStatus: true } }
    );
    res.status(200).redirect("/adminUserManagement");
  },
  adminUserDelete: async (req, res) => {
    try {
      await Userdb.deleteOne({ _id: req.params.id });
      res.status(200).redirect("/adminUserManagement");
    } catch (err) {
      console.log("quer Err", err);
      res.status(401).send("Internal server err");
    }
  },
  adminLogout: (req, res) => {
    req.session.destroy();
    res.status(200).redirect("/adminLogin");
  },

  adminChangeOrderStatus: async (req, res) => {
    try {
      await adminHelper.statusUpdate(
        req.params.orderId,
        req.params.productId,
        req.body.orderStatus
      );

      if (!req.body.filter) {
        return res.status(200).redirect("/adminOrderDetails");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server err");
    }
  },

  statusUpdate: async (req, res) => {
    try {
      const updateResult = await adminHelper.statusUpdate(
        req.params.orderId,
        req.params.productId,
        req.body.status
      );

      return res.status(200).redirect("/adminOrderDetails");
    } catch (error) {
      console.log("Error in Controller:", error);
      return res.status(500).send("Internal Server Error");
    }
  },
};
