const express = require('express');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes restricted to Admin, Team Leader, and Employee (for referrals)
router.use(protect);

// Agent Referral for all staff roles
router.post('/refer-agent', authorize('admin', 'team_leader', 'employee'), referAgent);

// General User management (Admin & Team Leader only)
router.get('/', authorize('admin', 'team_leader'), getUsers);
router.post('/', authorize('admin'), createUser);
router.patch('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
