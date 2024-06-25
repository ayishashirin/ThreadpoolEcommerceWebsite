const mongodb = require("mongoose");

const compareSchema = new mongodb.Schema({
  userId: {
    type: mongodb.SchemaTypes.ObjectId,
    required: true,
  },
  products: [
    {
      productId: {
        type: mongodb.SchemaTypes.ObjectId,
        required: true,
      }
  
    },
  ],
});

const comparedb = mongodb.model('comparedbs', compareSchema);

module.exports = comparedb;