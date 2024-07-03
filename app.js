const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv").config();
const morgan = require("morgan");
const flash = require("express-flash");
const passport = require("passport");
const connectDB = require("./server/database/connection");
const cors = require("cors");
const GoogleStrategy = require('passport-google-oauth2').Strategy; 

passport.serializeUser((user , done) => { 
	done(null , user); 
}) 
passport.deserializeUser(function(user, done) { 
	done(null, user); 
}); 

passport.use(new GoogleStrategy({ 
	clientID:process.env.CLIENT_ID, 
	clientSecret:process.env.CLIENT_SECRET,  
	callbackURL:"https://threadpool.shop/auth/google/callback", 
	passReqToCallback:true
}, 
function(request, accessToken, refreshToken, profile, done) { 
	return done(null, profile); 
} 
));




// Initialize express app
const app = express();

// Database connection
connectDB();

// CORS configuration
const corsOptions = {
  origin: ['https://chatrace.com/webchat/?p=1894441&id=ADJKHUyKtJ']
};
app.use(cors(corsOptions));

// Set view engine
app.set("view engine", "ejs");
app.set('views', '/home/ubuntu/ThreadpoolEcommerceWebsite/views');

// Middleware
app.use(morgan('dev'));
app.use(flash());
app.use(session({
  secret: process.env.sessionSecret,
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
