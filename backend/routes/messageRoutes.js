const express = require('express');
const { sendMessage, getMessages, getThreads, markAsRead, getDirectMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All authenticated roles can access threads related to their scope

router.post('/send', sendMessage);
router.get('/threads', getThreads);
router.get('/thread/:referralId', getMessages);
router.get('/direct/:userId', getDirectMessages);
router.patch('/thread/:referralId/read', markAsRead);
router.patch('/direct/:senderId/read', markAsRead);

module.exports = router;
