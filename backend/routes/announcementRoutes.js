const express = require('express');
const router = express.Router();
const {
    getAnnouncements,
    createAnnouncement,
    toggleAnnouncement
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getAnnouncements)
    .post(createAnnouncement);

router.route('/:id/toggle')
    .patch(toggleAnnouncement);

module.exports = router;
