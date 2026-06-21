const mongoose = require('mongoose');

const productAnalyticsSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true
  },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  
  // Engagement Metrics
  totalViews: { type: Number, default: 0 },
  totalAddsToCart: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  totalWishlists: { type: Number, default: 0 },
  
  // Behavioral Metrics (Averages)
  avgDwellTimeSeconds: { type: Number, default: 0 },
  avgScrollDepthPercent: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ProductAnalytics', productAnalyticsSchema);
