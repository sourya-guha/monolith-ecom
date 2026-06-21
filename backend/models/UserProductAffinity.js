const mongoose = require('mongoose');

const userProductAffinitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ensure unique combination of userId and productId
userProductAffinitySchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('UserProductAffinity', userProductAffinitySchema);
