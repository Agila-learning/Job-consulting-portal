const express = require('express');
const { getPerformanceReports, getTopPerformers } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/performance', getPerformanceReports);
router.get('/top-performers', getTopPerformers);

module.exports = router;
