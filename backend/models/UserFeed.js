const mongoose = require('mongoose');

const userFeedSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Embedding vector generated from the Collaborative Filtering model
  cfEmbedding: {
    type: [Number],
    default: []
  },
  // Embedding vector generated from the Content-Based Filtering model
  cbfEmbedding: {
    type: [Number],
    default: []
  },
  // Pre-computed recommended product IDs (optional, but highly useful for fast feed loading)
  recommendedProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    score: Number,
    modelType: {
      type: String,
      enum: ['CF', 'CBF', 'HYBRID']
    }
  }],
  lastComputedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('UserFeed', userFeedSchema);
