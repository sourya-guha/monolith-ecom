const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Get profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, firstName, lastName } = req.body;
    const computedName =
      typeof name === 'string' && name.trim()
        ? name.trim()
        : `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...(computedName ? { name: computedName } : {}), ...(email ? { email } : {}) },
      { new: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const { getCache, setCache } = require('../utils/cache');

// Get all products (for browsing)
exports.getAllProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 100);
    const skip = (page - 1) * limit;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';

    // Create a unique cache key
    const cacheKey = `products:page:${page}:limit:${limit}:search:${search}:category:${category}`;

    // Try to get from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`[cache] HIT for ${cacheKey}`);
      return res.json(cachedData);
    }

    console.log(`[cache] MISS for ${cacheKey} - Querying DB...`);

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) {
      filter.category = category;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    const responsePayload = {
      success: true,
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    };

    // Store in cache for 60 seconds
    await setCache(cacheKey, responsePayload, 60);

    res.json(responsePayload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { category: { $ne: null } });
    res.json({ success: true, data: categories.filter(Boolean).sort() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Place order
exports.placeOrder = async (req, res) => {
  let decremented = [];
  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    // Atomically decrement inventory while computing total. If anything fails, rollback prior decrements.
    let totalPrice = 0;
    decremented = [];

    for (const item of items) {
      if (!item?.product || !Number.isFinite(item.quantity) || item.quantity <= 0) {
        // rollback any decremented stock before returning
        for (const d of decremented) {
          await Product.findByIdAndUpdate(d.productId, { $inc: { stock: d.quantity } });
        }
        return res.status(400).json({ message: 'Invalid order item' });
      }

      const product = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: false }
      );

      if (!product) {
        for (const d of decremented) {
          await Product.findByIdAndUpdate(d.productId, { $inc: { stock: d.quantity } });
        }

        const exists = await Product.exists({ _id: item.product });
        if (!exists) {
          return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(400).json({ message: 'Insufficient stock for one or more items' });
      }

      decremented.push({ productId: product._id, quantity: item.quantity });
      totalPrice += product.price * item.quantity;
    }

    const order = await Order.create({
      user: req.user.id,
      items,
      totalPrice,
      shippingAddress
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    if (decremented.length > 0) {
      try {
        await Promise.all(
          decremented.map((d) => Product.findByIdAndUpdate(d.productId, { $inc: { stock: d.quantity } }))
        );
      } catch (_) {
        // If rollback fails, prefer surfacing original error.
      }
    }
    res.status(500).json({ message: err.message });
  }
};

// Get my orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product', 'name price');
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};