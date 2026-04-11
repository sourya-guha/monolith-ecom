const Product = require('../models/Product');

// Add product
exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, images } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      images,
      seller: req.user.id    // comes from auth middleware
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get seller's own products
exports.getMyProducts = async (req, res) => {
  try {
    console.log('[seller] getMyProducts user id:', req.user?.id);
    const products = await Product.find({ seller: req.user.id });
    console.log('[seller] getMyProducts count:', products.length);
    res.json({ success: true, products });
  } catch (err) {
    console.error('[seller] getMyProducts error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get one seller product
exports.getMyProductById = async (req, res) => {
  try {
    console.log('[seller] getMyProductById:', req.params.id, 'user:', req.user?.id);
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (err) {
    console.error('[seller] getMyProductById error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.user.id    // make sure seller owns this product
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      seller: req.user.id    // make sure seller owns this product
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
