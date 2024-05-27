const mongodb = require('mongoose');

const userVariationSchema = new mongodb.Schema({
    userId: {
        type: mongodb.SchemaTypes.ObjectId,
        required: true,
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
    defaultAddress: {
        type: String,
    }
});

const userVariationdb = mongodb.model('uservariationdbs', userVariationSchema);

module.exports = userVariationdb;