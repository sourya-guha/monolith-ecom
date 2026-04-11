const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const {
  addProduct,
  getMyProducts,
  getMyProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/seller.controller');

// All routes protected — seller only
router.use(auth, role('seller', 'admin'));

router.post('/products', addProduct);
router.get('/products', getMyProducts);
router.get('/products/:id', getMyProductById);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
