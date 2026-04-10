const express = require('express');
const { getJobs, getJob, createJob, updateJob, deleteJob } = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getJobs);
router.get('/:id', getJob);

// Modification routes restricted to Admin and Team Leader
router.post('/', authorize('admin', 'team_leader'), createJob);
router.patch('/:id', authorize('admin', 'team_leader'), updateJob);
router.delete('/:id', authorize('admin', 'team_leader'), deleteJob);

module.exports = router;
