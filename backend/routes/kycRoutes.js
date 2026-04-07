const express = require('express');
const { submitKYC, getOwnKYC, getAllKYC, updateKYCStatus } = require('../controllers/kycController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

// Agent routes
router.post('/submit', authorize('agent'), upload.fields([{ name: 'aadhaarFront', maxCount: 1 }, { name: 'panCard', maxCount: 1 }]), submitKYC);
router.get('/my', authorize('agent'), getOwnKYC);

// Admin routes
router.get('/all', authorize('admin'), getAllKYC);
router.patch('/:id/status', authorize('admin'), updateKYCStatus);

module.exports = router;
