const express = require('express');
const router = express.Router();
const { 
    createPerformanceLog, 
    getPerformanceLogs, 
    deletePerformanceLog 
} = require('../controllers/performanceLogController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All routes are protected

router.route('/')
    .post(createPerformanceLog)
    .get(getPerformanceLogs);

router.route('/:id')
    .delete(deletePerformanceLog);

module.exports = router;
