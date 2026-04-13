const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register User (For Agents/Public Self-Service)
// Route: POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const { name, email, mobile, role, ...additionalData } = req.body;

        // Validation: 10 digit mobile
        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
        }

        // Check if user already exists (by mobile or email)
        const userExists = await User.findOne({ 
            $or: [
                { mobile },
                { email: email || '___never_match___' }
            ]
        });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User with this mobile or email already exists' });
        }

        // Create user
        // Default password is mobile for non-admins
        const userPassword = mobile; 
        const status = role === 'agent' ? 'pending' : 'active';

        const user = await User.create({
            name,
            email,
            mobile,
            password: userPassword,
            role,
            status,
            ...additionalData
        });

        // For registration, we don't send token if it's an agent pending approval
        if (status === 'pending') {
            return res.status(201).json({
                success: true,
                message: 'Registration successful. Please wait for admin approval.'
            });
        }

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Login user
// Route: POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, identifier, mobile, password } = req.body;
        const loginId = identifier || email || mobile;

        // Validate identifier & password
        if (!loginId || !password) {
            return res.status(400).json({ success: false, message: 'Please provide credentials and password' });
        }

        // Check for user (by email or mobile)
        const user = await User.findOne({ 
            $or: [{ email: loginId }, { mobile: loginId }] 
        }).populate('branchId', 'name');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check user status
        if (user.status !== 'active') {
            const statusMessages = {
                pending: 'Your account is pending admin approval.',
                inactive: 'Your account has been deactivated. Please contact support.',
                rejected: 'Your registration request was declined.'
            };
            return res.status(403).json({ 
                success: false, 
                message: statusMessages[user.status] || 'Account restricted.' 
            });
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
