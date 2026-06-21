const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const {
  getProfile,
  updateProfile,
  getAllProducts,
  getProductCategories,
  getProduct,
  placeOrder,
  getMyOrders,
  cancelOrder,
  recordUserEvent,
  getCFRecommendations,
  getCBFRecommendations
} = require('../controllers/user.controller');

// Public routes — no login needed
router.get('/products/categories', getProductCategories);
router.get('/products', getAllProducts);
router.get('/products/:id', getProduct);

// Protected routes — login needed
router.get('/profile', auth, role('user', 'seller', 'admin'), getProfile);
router.put('/profile', auth, role('user', 'seller', 'admin'), updateProfile);
router.post('/orders', auth, role('user'), placeOrder);
router.get('/orders', auth, role('user'), getMyOrders);
router.put('/orders/:id/cancel', auth, role('user'), cancelOrder);
router.get('/recommendations/cf', auth, role('user'), getCFRecommendations);
router.get('/recommendations/cbf', auth, role('user'), getCBFRecommendations);

module.exports = router;