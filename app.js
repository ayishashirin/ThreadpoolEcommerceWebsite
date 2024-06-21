const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv").config();
const morgan = require("morgan");
const flash = require("express-flash");
const cropperjs = require("cropperjs");
const passport = require("passport");
const app = express();
const userSideRouter = require("./server/router/userSide/userRouter");
const adminSideRouter = require("./server/router/adminSide/adminRouter");
const errPageRouter = require("./server/router/errPage/errPageRouter");
const googleController = require("./server/controller/userSide/googleController");
const connectDB = require("./server/database/connection");

connectDB();

app.set("view engine", "ejs");
app.set('views', '/home/ubuntu/ThreadpoolEcommerceWebsite/views');

// app.use(morgan('dev'));
app.use(flash());
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

app.use(
  session({
    secret: process.env.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.get(
  "/googleController/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get(
  "/googleController/google/callback",
  passport.authenticate("google", {
    successRedirect: "/googleController/protected",
    failureRedirect: "/googleController/google/failure",
  })
);

app.get("/googleController/google/failure", (req, res) => {
  res.send("something went wrong!");
});

app.get("/googleController/protected", isLoggedIn, (req, res) => {
  let name = req.user.displayName;
  res.redirect("/");
});

app.use("/googleController/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use("/", userSideRouter);

app.use("/", adminSideRouter);

app.use("/", errPageRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`Server is running at http://localhost:${PORT}`)
);
 