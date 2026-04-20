const mongoose = require('mongoose');

const chatConversationSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

chatConversationSchema.index({ buyer: 1, seller: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);

