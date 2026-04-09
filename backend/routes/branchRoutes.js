const express = require('express');
const router = express.Router();
const { getBranches, createBranch } = require('../controllers/branchController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getBranches);
router.post('/', protect, authorize('admin'), createBranch);

module.exports = router;
