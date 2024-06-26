const mongodb = require('mongoose');

const userSchema = new mongodb.Schema({
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
        unique:true,
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
    
    
});

const Userdb = mongodb.model('Userdbs', userSchema);

module.exports = Userdb;