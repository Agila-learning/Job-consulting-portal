const express = require('express');
const { getDashboardSummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All authenticated roles can see their dashboard summary
router.get('/summary', getDashboardSummary);

module.exports = router;
