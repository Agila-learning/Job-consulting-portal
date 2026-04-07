const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAuditRecords, generateSnapshot } = require('../controllers/reportController');

// All role visibility
router.use(protect);

// Admin-only auditing
router.get('/', authorize('admin'), getAuditRecords);
router.post('/snapshot', authorize('admin'), generateSnapshot);

module.exports = router;
