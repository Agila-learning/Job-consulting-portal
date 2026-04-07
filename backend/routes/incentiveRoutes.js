const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
    getIncentives, createIncentive, updateIncentive, 
    deleteIncentive, grantManualIncentive, getManualGrants,
    updateManualGrant, deleteManualGrant
} = require('../controllers/incentiveController');

// All role visibility
router.use(protect);

// Get all incentive slabs
router.get('/', getIncentives);
router.get('/grants', getManualGrants);

// Admin-only operations
router.post('/', authorize('admin'), createIncentive);
router.post('/grant', authorize('admin'), grantManualIncentive);
router.patch('/grants/:id', authorize('admin'), updateManualGrant);
router.patch('/:id', authorize('admin'), updateIncentive);
router.delete('/grants/:id', authorize('admin'), deleteManualGrant);
router.delete('/:id', authorize('admin'), deleteIncentive);

module.exports = router;
