const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const { clearCachePattern } = require('../utils/cache');

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
      images: Array.isArray(images) ? images : [],
      seller: req.user.id, // comes from auth middleware
    });

    await clearCachePattern('products:*');

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error('[seller] addProduct error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Unable to create product' });
  }
};

exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: process.env.CLOUDINARY_FOLDER || 'ecom/products',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result.secure_url);
            }
          }
        );

        stream.end(file.buffer);
      });
    });

    const imageUrls = await Promise.all(uploadPromises);
    res.json({ success: true, images: imageUrls });
  } catch (err) {
    console.error('[seller] uploadImages error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Image upload failed' });
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

    await clearCachePattern('products:*');

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
    await clearCachePattern('products:*');
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
