const router = require('express').Router();
const multer = require('multer');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const {
  addProduct,
  uploadImages,
  getMyProducts,
  getMyProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/seller.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  // Per-file limit. Multer will throw "LIMIT_FILE_SIZE" if exceeded.
  limits: { fileSize: 10 * 1024 * 1024 },
});

// All routes protected — seller only
router.use(auth, role('seller', 'admin'));

router.post('/products', addProduct);
router.post('/upload', (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'File too large (max 10MB per image)' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(500).json({ success: false, message: err.message || 'Upload failed' });
    }
    return next();
  });
}, uploadImages);
router.get('/products', getMyProducts);
router.get('/products/:id', getMyProductById);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
