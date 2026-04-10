const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const {
  getAllUsers,
  deleteUser,
  getAllSellers,
  getAllProducts,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  changeUserRole
} = require('../controllers/admin.controller');

// All routes — admin only
router.use(auth, role('admin'));

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', changeUserRole);
router.get('/sellers', getAllSellers);
router.get('/products', getAllProducts);
router.delete('/products/:id', deleteProduct);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;