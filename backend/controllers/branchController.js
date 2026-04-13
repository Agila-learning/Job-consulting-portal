const Branch = require('../models/Branch');

// Get all branches
// Route: GET /api/branches
exports.getBranches = async (req, res) => {
    try {
        const branches = await Branch.find({ 
            status: { $in: ['active', null, undefined] } 
        }).sort('name');
        res.status(200).json({ success: true, count: branches.length, data: branches });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Create branch (Admin only)
exports.createBranch = async (req, res) => {
    try {
        const branch = await Branch.create(req.body);
        res.status(201).json({ success: true, data: branch });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
