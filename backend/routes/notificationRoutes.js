const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getNotifications, 
    markAsRead, 
    markAllRead, 
    deleteNotification 
} = require('../controllers/notificationController');

router.use(protect);

router.get('/', getNotifications);
router.patch('/mark-all-read', markAllRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
