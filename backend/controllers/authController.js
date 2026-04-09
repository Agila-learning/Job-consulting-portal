const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register User
// Route: POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, ...additionalData } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create user
        // Note: New Agents are set to 'pending' as per plan
        const status = role === 'agent' ? 'pending' : 'active';

        const user = await User.create({
            name,
            email,
            password,
            role,
            status,
            ...additionalData
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Login user
// Route: POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).populate('branchId', 'name');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check user status
        if (user.status === 'pending') {
            return res.status(403).json({ success: false, message: 'Account is pending approval. Please contact admin.' });
        }

        if (user.status === 'inactive' || user.status === 'rejected') {
            return res.status(403).json({ success: false, message: 'Your account is disabled.' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get current user
// Route: GET /api/auth/me
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('branchId', 'name');
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    res.status(statusCode).json({
        success: true,
        token,
        role: user.role,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            team: user.department || user.team,
            branchId: user.branchId?._id || user.branchId,
            branchName: user.branchId?.name || 'N/A'
        }
    });
};
