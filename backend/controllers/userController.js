const User = require('../models/User');

// Get all users with optional role filtering
// Route: GET /api/users
exports.getUsers = async (req, res) => {
    try {
        const { role, status } = req.query;
        let query = {};
        
        if (role) {
            // Handle both ?role=admin&role=employee and ?role=admin,employee
            let roleArray = [];
            try {
                if (Array.isArray(role)) {
                    roleArray = role.flatMap(r => typeof r === 'string' ? r.split(',') : []);
                } else if (typeof role === 'string') {
                    roleArray = role.split(',');
                }
                
                if (roleArray.length > 0) {
                    query.role = { $in: roleArray.map(r => r.trim()).filter(r => r) };
                }
            } catch (err) {
                console.error('Role parsing error:', err);
                // Fallback to no role filter if parsing fails
            }
        }
        if (status) query.status = status;

        // 3. Branch Segregation
        if (req.user.role !== 'admin') {
            query.branchId = req.user.branchId;
        }

        // 4. TL Reporting Logic
        if (req.user.role === 'team_leader') {
            query.reportingManager = req.user.id;
        }

        const users = await User.find(query).populate('branchId', 'name').select('-password').sort('-createdAt');
        
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Create a new employee (Admin only)
// Route: POST /api/users
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, ...additionalData } = req.body;

        // Validation: Only admin can create users, and only roles 'employee' or 'agent'
        if (role === 'admin') {
            return res.status(400).json({ success: false, message: 'Cannot create another admin via this route' });
        }
        
        if (req.user.role === 'team_leader' && role !== 'employee') {
            return res.status(403).json({ success: false, message: 'Team Leaders can only provision Employee accounts.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            status: 'active',
            branchId: req.user.role === 'admin' ? (additionalData.branchId || req.user.branchId) : req.user.branchId,
            ...additionalData
        });

        res.status(201).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Update user (Status, details, etc.)
// Route: PATCH /api/users/:id
exports.updateUser = async (req, res) => {
    try {
        let user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (req.user.role === 'team_leader' && user.role !== 'employee') {
            return res.status(403).json({ success: false, message: 'Unauthorized to modify non-employee accounts.' });
        }

        user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Deactivate user (Soft delete to maintain data integrity)
// Route: DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Admin accounts cannot be deactivated via this route.' });
        }

        if (req.user.role === 'team_leader' && user.role !== 'employee') {
            return res.status(403).json({ success: false, message: 'Unauthorized to deactivate non-employee accounts.' });
        }

        // Check if hard delete requested (Optional for super admin)
        if (req.query.hard === 'true' && req.user.role === 'admin') {
            await user.deleteOne();
            return res.status(200).json({ success: true, message: 'User permanently purged', data: {} });
        }

        user.status = 'inactive';
        await user.save();

        res.status(200).json({ success: true, message: 'Access credentials revoked (Deactivated)', data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
