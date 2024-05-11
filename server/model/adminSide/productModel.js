const mongodb = require('mongoose');

const productSchema = new mongodb.Schema({
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
    fPrice: {
        type: Number,
        required: true
    },
    lPrice: {
        type: Number,
        required: true
    },
   date:{
    type: Date,
    required: true
   },
    newlyLaunch: {
        type: Boolean,
        default: true,
        required: true
    },
    unlistedProduct: {
        type: Boolean,
        default:true
    },
    offers: [
        {
            type: mongodb.SchemaTypes.ObjectId,
        }
    ],
});

const productVariationSchema = new mongodb.Schema({
    productId: {
        type: mongodb.SchemaTypes.ObjectId,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    images: [
        {
            type: String
        }
    ]  
})

const Productdb = mongodb.model('Productdbs', productSchema);

const ProductVariationdb = mongodb.model('ProductVariationdbs', productVariationSchema);

module.exports = {
    Productdb,
    ProductVariationdb
}