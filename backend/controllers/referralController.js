const Referral = require('../models/Referral');
const Job = require('../models/Job');
const KYC = require('../models/KYC');
const IncentiveSlab = require('../models/IncentiveSlab');

// Create a new referral
// Route: POST /api/referrals
exports.createReferral = async (req, res) => {
    try {
        const { jobId, ...candidateData } = req.body;
        
        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        // Handle persistent resume upload
        let resumeUrl = candidateData.resumeUrl || '';
        if (req.file) {
            // Store relative path for static serving
            resumeUrl = `/uploads/resumes/${req.file.filename}`;
        }

        // Set source and referrer
        const referral = await Referral.create({
            ...candidateData,
            resumeUrl,
            job: jobId,
            sourceType: candidateData.sourceType || (req.user.role === 'admin' ? 'self' : req.user.role),
            referrer: req.user.id,
            status: 'New Referral',
            activityLogs: [{
                action: 'Referral submitted',
                user: req.user.id
            }]
        });

        res.status(201).json({ success: true, data: referral });

        // Emit real-time notification to Admins
        const io = req.app.get('io');
        io.emit('newReferral', {
            message: `New candidate ${referral.candidateName} registered for ${job.jobTitle}`,
            referralId: referral._id
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get referrals with role-based filtering
// Route: GET /api/referrals
exports.getReferrals = async (req, res) => {
    try {
        let query = {};

        // Role-based filtering
        if (req.user.role === 'agent') {
            query.referrer = req.user.id;
        } else if (req.user.role === 'employee' || req.user.role === 'team_leader') {
            // Find all reports if team_leader
            const User = require('../models/User');
            const reports = await User.find({ reportingManager: req.user.id }).select('_id');
            const reportIds = reports.map(r => r._id);
            
            // Show what they submitted, what's assigned to them, or what's assigned to their reports
            query = { 
                $or: [
                    { referrer: req.user.id }, 
                    { assignedEmployee: req.user.id },
                    { assignedEmployee: { $in: reportIds } }
                ] 
            };
        }

        // Admin sees everything (no filter)

        const referrals = await Referral.find(query)
            .populate('job', 'jobTitle companyName')
            .populate('referrer', 'name email')
            .populate('assignedEmployee', 'name email')
            .sort('-createdAt');

        res.status(200).json({ success: true, count: referrals.length, data: referrals });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Assign referral to employee (Admin only)
// Route: PATCH /api/referrals/:id/assign
exports.assignReferral = async (req, res) => {
    try {
        const { employeeId } = req.body;
        const referral = await Referral.findById(req.params.id);

        if (!referral) {
            return res.status(404).json({ success: false, message: 'Referral not found' });
        }

        referral.assignedEmployee = employeeId;
        referral.status = 'Assigned';
        referral.activityLogs.push({
            action: `Assigned to consultant`,
            user: req.user.id
        });

        await referral.save();

        res.status(200).json({ success: true, data: referral });

        // Emit real-time notification to Assigned Employee
        const io = req.app.get('io');
        io.to(assignedEmployee).emit('assignmentNotification', {
            message: `New candidate ${referral.candidateName} assigned to you`,
            referralId: referral._id
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Update referral status and comments
// Route: PATCH /api/referrals/:id/status
exports.updateReferralStatus = async (req, res) => {
    try {
        const { status, comment, payoutStatus, payoutNotes, calculatedCommission } = req.body;
        const referral = await Referral.findById(req.params.id);

        if (!referral) {
            return res.status(404).json({ success: false, message: 'Referral not found' });
        }

        // Payout Updates (Financial Hub CRUD & Manual Overrides)
        if (payoutStatus) referral.payoutStatus = payoutStatus;
        if (payoutNotes) referral.payoutNotes = payoutNotes;
        if (calculatedCommission !== undefined) referral.calculatedCommission = calculatedCommission;

        // Permission check: admin, team_leader, or assigned employee
        // Permission check: admin, team_leader, or assigned employee
        const userRole = req.user.role;
        const userId = req.user.id.toString();
        const assignedId = referral.assignedEmployee?.toString();
        
        console.log(`[AUTH CHECK] User: ${userId}, Role: ${userRole}, Assigned: ${assignedId}`);

        const isAuthorized = userRole === 'admin' || 
                           userRole === 'team_leader' || 
                           assignedId === userId;
                           
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this referral' });
        }

        if (status) {
            // Check KYC for Joined status (Incentive Eligibility)
            if (status === 'Joined') {
                // Fetch referrer to check role
                const User = require('../models/User');
                const referrer = await User.findById(referral.referrer);
                
                // Only enforce KYC for Agents
                if (referrer && referrer.role === 'agent') {
                    const referrerKyc = await KYC.findOne({ agent: referral.referrer, status: 'verified' });
                    if (!referrerKyc) {
                        return res.status(403).json({ 
                            success: false, 
                            message: 'Commission locked: Agent must complete KYC verification before candidate can be marked as Joined.' 
                        });
                    }
                }

                // Calculate Commission
                const job = await Job.findById(referral.job);
                if (job) {
                    // 1. Check Job-specific incentive
                    const baseIncentive = (referral.sourceType === 'agent' || referral.sourceType === 'self') ? job.incentiveAgent : job.incentiveEmployee;
                    if (baseIncentive && !isNaN(parseInt(baseIncentive))) {
                        referral.calculatedCommission = baseIncentive;
                    } else {
                        // 2. Check for active Incentive Slab for this domain/role
                        const slab = await IncentiveSlab.findOne({ 
                            domain: job.domain, 
                            userRole: (referral.sourceType === 'agent' || referral.sourceType === 'self') ? 'agent' : 'employee',
                            status: 'active'
                        });
                        if (slab && slab.thresholds.length > 0) {
                            referral.calculatedCommission = slab.thresholds[0].rewardValue;
                        }
                    }
                    referral.payoutStatus = 'pending_approval';
                }
            }

            referral.status = status;
            referral.activityLogs.push({
                action: `Status updated to ${status}`,
                user: req.user.id,
                comment: comment || ''
            });

            // Emit real-time notification to Referrer
            const io = req.app.get('io');
            io.to(referral.referrer.toString()).emit('statusChanged', {
                message: `Status of ${referral.candidateName} updated to ${status}`,
                referralId: referral._id,
                status
            });
        }if (comment) {
            referral.comments.push({
                user: req.user.id,
                text: comment,
                type: req.user.role
            });
        }

        await referral.save();

        res.status(200).json({ success: true, data: referral, message: 'Lifecycle State Updated' });
    } catch (err) {
        console.error('Migration Protocol Failure:', err);
        res.status(500).json({ success: false, message: err.message || 'System-level transition failure' });
    }
};

// General update for CRM fields
// Route: PATCH /api/referrals/:id
exports.updateReferral = async (req, res) => {
    try {
        const referral = await Referral.findById(req.params.id);

        if (!referral) {
            return res.status(404).json({ success: false, message: 'Referral not found' });
        }

        // Permission check
        const isAuthorized = req.user.role === 'admin' || 
                           req.user.role === 'team_leader' || 
                           referral.assignedEmployee?.toString() === req.user.id || 
                           referral.referrer?.toString() === req.user.id;

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this referral' });
        }

        const updatedReferral = await Referral.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        res.status(200).json({ success: true, data: updatedReferral });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Bulk update referral status or assignments
// Route: PATCH /api/referrals/bulk-update
exports.bulkUpdateReferrals = async (req, res) => {
    try {
        const { ids, status, assignedEmployee, priority } = req.body;
        
        const updateData = {};
        if (status) updateData.status = status;
        if (assignedEmployee) updateData.assignedEmployee = assignedEmployee;
        if (priority) updateData.priority = priority;

        await Referral.updateMany(
            { _id: { $in: ids } },
            { 
                $set: updateData,
                $push: { 
                    activityLogs: { 
                        action: `Bulk updated: ${Object.keys(updateData).join(', ')}`,
                        user: req.user.id,
                        timestamp: new Date()
                    } 
                } 
            }
        );

        res.status(200).json({ success: true, message: 'Bulk update successful' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get Pipeline Stats
// Route: GET /api/referrals/stats
exports.getReferralStats = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'agent') {
            query.referrer = req.user.id;
        } else if (req.user.role === 'employee' || req.user.role === 'team_leader') {
            const User = require('../models/User');
            const reports = await User.find({ reportingManager: req.user.id }).select('_id');
            const reportIds = reports.map(r => r._id);
            
            query = { 
                $or: [
                    { referrer: req.user.id }, 
                    { assignedEmployee: req.user.id },
                    { assignedEmployee: { $in: reportIds } }
                ] 
            };
        }

        const stats = await Referral.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalCandidates: { $sum: 1 },
                    hiredCount: { $sum: { $cond: [{ $eq: ["$status", "Joined"] }, 1, 0] } },
                    interviewCount: { $sum: { $cond: [{ $eq: ["$status", "Interview Scheduled"] }, 1, 0] } },
                    shortlistedCount: { $sum: { $cond: [{ $eq: ["$status", "Shortlisted"] }, 1, 0] } },
                    pendingCount: { $sum: { $cond: [{ $in: ["$status", ["New Referral", "Assigned", "Screening"]] }, 1, 0] } }
                }
            }
        ]);

        const activeJobs = await Job.countDocuments({ status: 'active' });

        const defaultStats = {
            totalCandidates: 0,
            hiredCount: 0,
            interviewCount: 0,
            shortlistedCount: 0,
            activePipeline: 0
        };

        const result = stats.length > 0 ? {
            ...stats[0],
            activeJobs,
            pendingReferrals: stats[0].pendingCount,
            activePipeline: stats[0].totalCandidates - stats[0].hiredCount
        } : { ...defaultStats, activeJobs };

        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Purge Ecosystem Node
exports.deleteReferral = async (req, res) => {
    try {
        const referral = await Referral.findById(req.params.id);

        if (!referral) {
            return res.status(404).json({ success: false, message: 'Candidate record not found' });
        }

        await referral.deleteOne();

        res.status(200).json({ success: true, message: 'Candidate record purged' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Sync Incentive Data (Reconcile state)
// Route: PATCH /api/referrals/sync-incentives
exports.syncIncentives = async (req, res) => {
    try {
        const joinedReferrals = await Referral.find({ status: 'Joined' }).populate('job');
        let updateCount = 0;

        for (let ref of joinedReferrals) {
            if (!ref.calculatedCommission) {
                const job = ref.job;
                if (job) {
                    const baseIncentive = ref.sourceType === 'agent' ? job.incentiveAgent : job.incentiveEmployee;
                    if (baseIncentive && !isNaN(parseInt(baseIncentive))) {
                        ref.calculatedCommission = baseIncentive;
                    } else {
                        const slab = await IncentiveSlab.findOne({ 
                            domain: job.domain, 
                            userRole: ref.sourceType,
                            status: 'active'
                        });
                        if (slab && slab.thresholds.length > 0) {
                            ref.calculatedCommission = slab.thresholds[0].rewardValue;
                        }
                    }
                    if (ref.calculatedCommission) {
                        ref.payoutStatus = ref.payoutStatus === 'unearned' ? 'pending_approval' : ref.payoutStatus;
                        await ref.save();
                        updateCount++;
                    }
                }
            }
        }

        res.status(200).json({ 
            success: true, 
            message: `Synchronization complete. ${updateCount} records reconciled.`,
            affected: updateCount
        });
    } catch (err) {
        console.error('Incentive Sync Failure:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Purge Mock Data (Admin only - IRREVERSIBLE)
// Route: DELETE /api/referrals/purge-mock-data
exports.purgeMockData = async (req, res) => {
    try {
        // Only Admin can perform this
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized for system-level purge' });
        }

        // Delete all data except Users
        await Promise.all([
            Referral.deleteMany({}),
            Job.deleteMany({}),
            KYC.deleteMany({}),
            IncentiveSlab.deleteMany({}),
            require('../models/Notification').deleteMany({}),
            require('../models/IncentiveGrant').deleteMany({})
        ]);

        res.status(200).json({ 
            success: true, 
            message: 'Ecosystem Reset Complete: All mock referrals, jobs, KYC, and incentive records have been purged.' 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Reset protocol failure: ' + err.message });
    }
};
