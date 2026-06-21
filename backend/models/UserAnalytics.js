const mongoose = require('mongoose');

const userAnalyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Engagement
  totalInteractions: { type: Number, default: 0 },
  
  // Feature Preferences
  // Map of category name to interaction count
  categoryAffinities: {
    type: Map,
    of: Number,
    default: {}
  },
  
  // Average price point of products they interact with
  avgPricePoint: { type: Number, default: 0 },

  // Extracted user context features
  devices: [{ type: String }],
  browsers: [{ type: String }],
  locations: [{ type: String }],

}, { timestamps: true });

module.exports = mongoose.model('UserAnalytics', userAnalyticsSchema);
