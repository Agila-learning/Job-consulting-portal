const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeResume } = require('../controllers/atsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure multer for in-memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// All ATS routes are protected and restricted to Admin & Team Leader
router.use(protect);
router.use(authorize('admin', 'team_leader'));

// In-memory analysis route
router.post('/analyze', upload.single('resume'), analyzeResume);

module.exports = router;
