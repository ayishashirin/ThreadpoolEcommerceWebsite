const mongodb = require('mongoose');

const orderSchema = new mongodb.Schema({
    userId: {
        type: mongodb.SchemaTypes.ObjectId,
        required: true,
    },
    orderId: {
        type: String,
    },

    orderItems: [
        {
            productId: {
                type: mongodb.SchemaTypes.ObjectId,
                required: true,
            },
            pName: {
                type: String,
                required: true
            },
            category: {
                type: String,
                required: true
            },
            
            pDescription: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            fPrice: {
                type: Number,
                required: true
            },
            lPrice: {
                type: Number,
                required: true
            },
            size:{
                type: String,
                required:true
            },
            offerDiscountAmount: {
                type: Number,
                default: 0,
            },
            images: {
                type: String
            },
            orderStatus: {
                type: String,
                default: "Ordered",

                required: true
            },
            color:{
                type: String,
                required: true

            }, 
            couponDiscountAmount: {
                type: Number,
                default: 0,
            },
           totalAmount:{
            type: Number
           }
          
        }
    ],
    totalPrice:{
        type:Number
    },
    paymentMethode: {
        type: String,
        required: true 
    },
    orderDate: {
        type: Date,
        default: Date.now()
    },
    amountTakenFromWallet: {
        type: Number,
        default: 0,
    },
 
    address: [
        {
          name: {
            type: String,
            required: true
          },
          country: {
            type: String,
            required: true
          },
          state: {
            type: String,
            required: true
          },
          district: {
            type: String,
            required: true
          },
         
          city: {
            type: String,
            required: true
          },
          houseName: {
            type: String,
            required: true
          },
          phoneNo: {
            type: Number,
            required: true
          },
          pin: {
            type: Number,
            required: true
          },
          structuredAddress: {
            type: String,
            required: true
          }
        }
    ],
});

const Orderdb = mongodb.model('orderdbs', orderSchema);

module.exports = Orderdb;