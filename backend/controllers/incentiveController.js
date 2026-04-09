const IncentiveSlab = require('../models/IncentiveSlab');
const ManualIncentive = require('../models/ManualIncentive');
const IncentiveRule = require('../models/IncentiveRule');
const IncentiveLog = require('../models/IncentiveLog');
const IncentivePayment = require('../models/IncentivePayment');

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

// --- NEW INCENTIVE MODULE (BRANCH-AWARE) ---

// Get Incentive Rules
exports.getIncentiveRules = async (req, res) => {
    try {
        const rules = await IncentiveRule.find().sort('role event');
        res.status(200).json({ success: true, data: rules });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Create/Update Incentive Rule
exports.upsertIncentiveRule = async (req, res) => {
    try {
        const { role, event, amount, status } = req.body;
        let rule = await IncentiveRule.findOne({ role, event });
        
        if (rule) {
            rule.amount = amount;
            rule.status = status || rule.status;
            await rule.save();
        } else {
            rule = await IncentiveRule.create({ role, event, amount, status });
        }
        
        res.status(200).json({ success: true, data: rule });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get Incentive Logs (Filtered by Branch)
exports.getIncentiveLogs = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'team_leader') {
            query.branchId = req.user.branchId;
        } else if (req.query.branchId && req.query.branchId !== 'all') {
            query.branchId = req.query.branchId;
        }
        
        const logs = await IncentiveLog.find(query)
            .populate('user', 'name role')
            .populate('referral', 'candidateName')
            .sort('-createdAt');
            
        res.status(200).json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Create Payout (Bulk approve logs)
exports.createPayout = async (req, res) => {
    try {
        const { userId, logIds, totalAmount, branchId } = req.body;
        
        const payout = await IncentivePayment.create({
            user: userId,
            amount: totalAmount,
            logs: logIds,
            branchId: branchId || req.user.branchId,
            status: 'Pending'
        });
        
        // Update logs to 'payout_created'
        await IncentiveLog.updateMany(
            { _id: { $in: logIds } },
            { $set: { status: 'payout_created' } }
        );
        
        res.status(201).json({ success: true, data: payout });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get Payouts
exports.getPayouts = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'team_leader') {
            query.branchId = req.user.branchId;
        } else if (req.query.branchId && req.query.branchId !== 'all') {
            query.branchId = req.query.branchId;
        } else if (req.user.role !== 'admin') {
            query.user = req.user.id;
        }
        
        const payouts = await IncentivePayment.find(query)
            .populate('user', 'name role')
            .sort('-createdAt');
            
        res.status(200).json({ success: true, data: payouts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
