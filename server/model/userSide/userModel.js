const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  userStatus: {
    type: Boolean,
    required: true
  },
  userLstatus: {
    type: Boolean,
    default: true,
  },
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: String
  },
  referralCount: {
    type: Number,
    default: 0
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true ,
  },
  googleDisplayName: String,
  googleEmail: {
    type: String,
    unique: true,
    sparse: true 
  },
});

const Userdb = mongoose.model('Userdb', userSchema);

module.exports = Userdb;