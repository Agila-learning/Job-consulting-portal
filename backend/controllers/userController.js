const User = require('../models/User');

// Get all users with optional role filtering
// Route: GET /api/users
exports.getUsers = async (req, res) => {
    try {
        const { role, status, branchId } = req.query;
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
            if (req.user.branchId) {
                query.branchId = req.user.branchId;
            } else {
                // If user has no branchId, they might see nothing or global. 
                // For colleagues, we let them see all if they are a 'floating' user
            }
        } else if (branchId && branchId !== 'all') {
            query.branchId = branchId;
        }

        // 4. TL Visibility Logic (Broadened to Branch-wide)
        // If a specific reporting scope is requested, we can apply it
        if (req.user.role === 'team_leader' && req.query.scope === 'direct') {
            query.reportingManager = req.user.id;
        }

        const users = await User.find(query).populate('branchId', 'name').select('-password').sort('-createdAt');
        
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Create a new employee/TL/Agent (Admin only)
// Route: POST /api/users
exports.createUser = async (req, res) => {
    try {
        const { name, email, mobile, role, ...additionalData } = req.body;

        // Validation: Only admin can create users, and only roles 'employee' or 'agent'
        if (role === 'admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot create another admin via this route' });
        }
        
        if (req.user.role === 'team_leader' && role !== 'employee') {
            return res.status(403).json({ success: false, message: 'Team Leaders can only provision Employee accounts.' });
        }

        // Validate mobile
        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
        }

        const userExists = await User.findOne({ 
            $or: [
                { mobile },
                { email: email || '___never_match___' }
            ]
        });

        if (userExists) {
            return res.status(400).json({ success: false, message: 'User with this mobile or email already exists' });
        }

        // Auto-set password to mobile for everyone created here
        const user = await User.create({
            name,
            email,
            mobile,
            password: mobile,
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

// Refer a new Partner/Agent (Employee & TL Access)
// Route: POST /api/users/refer-agent
exports.referAgent = async (req, res) => {
    try {
        const { name, email, mobile, agencyName, city, specialization } = req.body;

        // Check if agent already exists
        const existingUser = await User.findOne({ mobile });
        if (existingUser) {
            return res.status(400).json({ success: true, message: 'This mobile number is already registered in our system.' });
        }

        // Create the agent record with status 'pending'
        const agent = await User.create({
            name,
            email,
            mobile,
            agencyName,
            city,
            specialization: specialization ? specialization.split(',').map(s => s.trim()) : [],
            role: 'agent',
            status: 'pending', // Requires admin verification
            referredBy: req.user.id,
            password: `Partner@${mobile.slice(-4)}` // Temporary password
        });

        res.status(201).json({
            success: true,
            message: 'Agent referral sequence initialized and archived for verification.',
            data: { id: agent._id, name: agent.name }
        });

        // Optional: Emit notification to Admin
        const io = req.app.get('io');
        if (io) {
            io.emit('agentReferralNotification', {
                message: `New agent referral: ${name} (from ${req.user.name})`,
                agentId: agent._id
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
