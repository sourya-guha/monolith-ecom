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
  limits: { fileSize: 5 * 1024 * 1024 },
});

// All routes protected — seller only
router.use(auth, role('seller', 'admin'));

router.post('/products', addProduct);
router.post('/upload', upload.array('images', 5), uploadImages);
router.get('/products', getMyProducts);
router.get('/products/:id', getMyProductById);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
