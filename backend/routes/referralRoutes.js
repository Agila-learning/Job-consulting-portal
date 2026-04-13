const express = require('express');
const multer = require('multer');
const path = require('path');
const { 
    createReferral, 
    getReferrals, 
    assignReferral, 
    updateReferralStatus, 
    updateReferral, 
    bulkUpdateReferrals, 
    getReferralStats,
    getBranchActivity,
    deleteReferral,
    syncIncentives,
    purgeMockData,
    incrementCalls
} = require('../controllers/referralController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Multer storage configuration for persistent resumes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/resumes/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for persistent storage
});

// All routes are protected
router.use(protect);

router.get('/', getReferrals);
router.get('/stats', getReferralStats);
router.get('/branch-activity', getBranchActivity);
router.post('/', upload.single('resume'), createReferral);

// Bulk actions
router.patch('/bulk-update', authorize('admin', 'employee', 'team_leader'), bulkUpdateReferrals);
router.patch('/sync-incentives', authorize('admin'), syncIncentives);
router.delete('/purge-mock-data', authorize('admin'), purgeMockData);

// Assignment for Admins and Team Leaders
router.patch('/:id/assign', authorize('admin', 'team_leader'), assignReferral);

// Status and general updates
router.patch('/:id/increment-calls', incrementCalls);
router.patch('/:id/status', authorize('admin', 'employee', 'team_leader'), updateReferralStatus);
router.patch('/:id', authorize('admin', 'employee', 'team_leader'), updateReferral);
router.delete('/:id', authorize('admin', 'team_leader'), deleteReferral);

module.exports = router;
