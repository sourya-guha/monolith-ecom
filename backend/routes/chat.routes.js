const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');
const {
  startConversationForProduct,
  listConversations,
  getMessages,
} = require('../controllers/chat.controller');

router.use(auth, role('user', 'seller', 'admin'));

router.post('/start', role('user'), startConversationForProduct);
router.get('/conversations', listConversations);
router.get('/conversations/:id/messages', getMessages);

module.exports = router;

