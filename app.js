const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv").config();
const morgan = require("morgan");
const flash = require("express-flash");
const passport = require("passport");
const connectDB = require("./server/database/connection");
const cors = require("cors");

// Load Passport config
require("./server/passport");

// Initialize express app
const app = express();

// Database connection
connectDB();

// CORS configuration
const corsOptions = {
  origin: ['https://chatrace.com/webchat/?p=1325286&id=M4CLtI92V5iJ97Gz']
};
app.use(cors(corsOptions));

// Set view engine
app.set("view engine", "ejs");
app.set('views', './views');

// Middleware
app.use(morgan('dev'));
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Routers
const userSideRouter = require("./server/router/userSide/userRouter");
const adminSideRouter = require("./server/router/adminSide/adminRouter");
const errPageRouter = require("./server/router/errPage/errPageRouter");

app.use("/", userSideRouter);
app.use("/", adminSideRouter);
app.use("/", errPageRouter);

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server is running at http://localhost:${PORT}`)
);
