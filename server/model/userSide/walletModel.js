const mongoose = require('mongoose');

const userWalletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    walletBalance: {
        type: Number,
        default: 0,
    },
    transactions: [
        {
            amount: {
                type: Number
            },
            transactionDate: {
                type: Date,
                default: Date.now(),
            },
            status:{
                type: String,
                 
            },
            details:{
                type: String, 
            }
        }
    ]
});

module.exports = mongoose.model('userWalletdbs', userWalletSchema);