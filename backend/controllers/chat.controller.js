const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');
const Product = require('../models/Product');

function toObjectIdString(value) {
  return value ? String(value) : '';
}

function canAccessConversation(user, conversation) {
  const userId = toObjectIdString(user?.id);
  return (
    userId &&
    (userId === toObjectIdString(conversation.buyer) || userId === toObjectIdString(conversation.seller))
  );
}

// Buyer-only: start or get a chat for a product
exports.startConversationForProduct = async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ success: false, message: 'Only buyers can start chats' });
    }

    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const product = await Product.findById(productId).select('seller');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const sellerId = product.seller;
    const buyerId = req.user.id;

    const conversation = await ChatConversation.findOneAndUpdate(
      { buyer: buyerId, seller: sellerId, product: productId },
      { $setOnInsert: { buyer: buyerId, seller: sellerId, product: productId } },
      { upsert: true, new: true }
    );

    return res.status(201).json({ success: true, conversation });
  } catch (err) {
    if (err?.code === 11000) {
      const existing = await ChatConversation.findOne({
        buyer: req.user.id,
        product: req.body.productId,
      });
      return res.json({ success: true, conversation: existing });
    }

    console.error('[chat] startConversationForProduct error:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Unable to start chat' });
  }
};

// Buyer/Seller/Admin: list conversations
exports.listConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query = {};
    if (role === 'user') query = { buyer: userId };
    else if (role === 'seller') query = { seller: userId };
    else query = { $or: [{ buyer: userId }, { seller: userId }] };

    const conversations = await ChatConversation.find(query)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .populate('product', 'name images');

    return res.json({ success: true, conversations });
  } catch (err) {
    console.error('[chat] listConversations error:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Unable to load chats' });
  }
};

// Buyer/Seller/Admin: fetch messages for a conversation
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const before = req.query.before ? new Date(String(req.query.before)) : null;

    const conversation = await ChatConversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!canAccessConversation(req.user, conversation)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const filter = { conversation: id };
    if (before && !Number.isNaN(before.getTime())) {
      filter.createdAt = { $lt: before };
    }

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name email role');

    return res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    console.error('[chat] getMessages error:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Unable to load messages' });
  }
};

