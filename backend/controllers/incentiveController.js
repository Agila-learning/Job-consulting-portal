const IncentiveSlab = require('../models/IncentiveSlab');
const ManualIncentive = require('../models/ManualIncentive');

// Get all incentive slabs
// Route: GET /api/incentives
exports.getIncentives = async (req, res) => {
    try {
        const incentives = await IncentiveSlab.find({ status: 'active' }).sort('-createdAt');
        res.status(200).json({ success: true, count: incentives.length, data: incentives });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Create a new incentive slab (Admin only)
// Route: POST /api/incentives
exports.createIncentive = async (req, res) => {
    try {
        const incentive = await IncentiveSlab.create({
            ...req.body,
            createdBy: req.user.id
        });
        res.status(201).json({ success: true, data: incentive });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Update an incentive slab (Admin only)
// Route: PATCH /api/incentives/:id
exports.updateIncentive = async (req, res) => {
    try {
        const incentive = await IncentiveSlab.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!incentive) {
            return res.status(404).json({ success: false, message: 'Incentive slab not found' });
        }
        res.status(200).json({ success: true, data: incentive });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete/Deactivate incentive (Admin only)
// Route: DELETE /api/incentives/:id
exports.deleteIncentive = async (req, res) => {
    try {
        const incentive = await IncentiveSlab.findById(req.params.id);
        if (!incentive) {
            return res.status(404).json({ success: false, message: 'Incentive slab not found' });
        }
        // Soft delete/deactivate
        incentive.status = 'inactive';
        await incentive.save();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
// Grant a manual incentive (Individual or Team)
// Route: POST /api/incentives/grant
exports.grantManualIncentive = async (req, res) => {
    try {
        const { recipient, amount, type, reason } = req.body;
        
        const grant = await ManualIncentive.create({
            recipient: ['individual', 'agent'].includes(type) ? recipient : null,
            amount,
            type,
            reason,
            createdBy: req.user.id
        });

        res.status(201).json({ success: true, data: grant });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get all manual grants
// Route: GET /api/incentives/grants
exports.getManualGrants = async (req, res) => {
    try {
        const grants = await ManualIncentive.find()
            .populate('recipient', 'name email role')
            .populate('createdBy', 'name')
            .sort('-createdAt');
        res.status(200).json({ success: true, count: grants.length, data: grants });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
// Update a manual grant (Admin only - for Payout reconciliation)
// Route: PATCH /api/incentives/grants/:id
exports.updateManualGrant = async (req, res) => {
    try {
        const grant = await ManualIncentive.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!grant) {
            return res.status(404).json({ success: false, message: 'Grant not found' });
        }
        res.status(200).json({ success: true, data: grant });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete manual grant (Admin only)
// Route: DELETE /api/incentives/grants/:id
exports.deleteManualGrant = async (req, res) => {
    try {
        const grant = await ManualIncentive.findById(req.params.id);
        if (!grant) {
            return res.status(404).json({ success: false, message: 'Grant not found' });
        }
        await grant.deleteOne();
        res.status(200).json({ success: true, message: 'Financial record purged from ledger' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
