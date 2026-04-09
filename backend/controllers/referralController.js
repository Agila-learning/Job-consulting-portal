const Referral = require('../models/Referral');
const Job = require('../models/Job');
const KYC = require('../models/KYC');
const IncentiveSlab = require('../models/IncentiveSlab');

// Create a new referral
// Route: POST /api/referrals
exports.createReferral = async (req, res) => {
    try {
        const { jobId, ...candidateData } = req.body;
        const User = require('../models/User');
        const Branch = require('../models/Branch');
        
        // 1. Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        // 2. Determine Branch with Intelligent Mapping
        let branchId = req.user.branchId; // Default to submitter's branch
        if (candidateData.preferredLocation) {
            const loc = candidateData.preferredLocation.toLowerCase();
            
            // Branch mapping keywords
            const mapping = [
                { branch: 'Bangalore', keywords: ['bangalore', 'bengaluru', 'madiwala', 'ecity', 'karnataka', 'ka', 'whitefield'] },
                { branch: 'Chennai', keywords: ['chennai', 'madras', 'tn', 'tamil nadu', 'adyar', 'velachery', 'guindy'] },
                { branch: 'Krishnagiri', keywords: ['krishnagiri', 'hosur', 'dharmapuri'] }
            ];

            const foundMapping = mapping.find(m => m.keywords.some(k => loc.includes(k)));
            
            if (foundMapping) {
                const branchObj = await Branch.findOne({ name: foundMapping.branch });
                if (branchObj) branchId = branchObj._id;
            } else {
                // Fallback to exact regex match
                const branch = await Branch.findOne({ 
                    name: { $regex: new RegExp(`^${candidateData.preferredLocation}$`, 'i') } 
                });
                if (branch) branchId = branch._id;
            }
        }

        // 3. Find Team Leader for Auto-Assignment
        let assignedEmployee = null;
        const teamLeader = await User.findOne({ 
            role: 'team_leader', 
            branchId, 
            team: job.domain 
        });
        
        if (teamLeader) {
            assignedEmployee = teamLeader._id;
        }

        // Handle persistent resume upload
        let resumeUrl = candidateData.resumeUrl || '';
        if (req.file) {
            resumeUrl = `/uploads/resumes/${req.file.filename}`;
        }

        // 4. Create Referral
        const referral = await Referral.create({
            ...candidateData,
            resumeUrl,
            job: jobId,
            branchId,
            assignedEmployee,
            assignedTeam: job.domain,
            sourceType: candidateData.sourceType || (req.user.role === 'admin' ? 'self' : req.user.role),
            referrer: req.user.id,
            status: assignedEmployee ? 'Assigned' : 'New Referral',
            activityLogs: [{
                action: assignedEmployee ? `Auto-assigned to ${job.domain} Team Leader` : 'Referral submitted',
                user: req.user.id
            }]
        });

        res.status(201).json({ success: true, data: referral });

        // Emit notifications
        const io = req.app.get('io');
        io.emit('newReferral', {
            message: `New candidate ${referral.candidateName} for ${job.jobTitle} (${candidateData.preferredLocation || 'Main'})`,
            referralId: referral._id,
            role: 'admin'
        });

        if (assignedEmployee) {
            io.to(assignedEmployee.toString()).emit('newReferral', {
                message: `New ${job.domain} candidate auto-assigned: ${referral.candidateName}`,
                referralId: referral._id,
                role: 'team_leader'
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get referrals with role-based filtering
// Route: GET /api/referrals
exports.getReferrals = async (req, res) => {
    try {
        let query = {};

        // 1. Branch Segregation
        const { branchId } = req.query;
        if (req.user.role !== 'admin') {
            query.branchId = req.user.branchId;
        } else if (branchId && branchId !== 'all') {
            query.branchId = branchId;
        }

        // 2. Role-based data visibility
        if (req.user.role === 'agent') {
            query.referrer = req.user.id;
        } else if (req.user.role === 'employee') {
            // Employees see what they referred OR what is assigned to them
            query.$or = [
                { referrer: req.user.id },
                { assignedEmployee: req.user.id }
            ];
            // If branch filter is active, we must ensure it's still applied
            if (query.branchId) {
                query.$and = [
                    { branchId: query.branchId },
                    { $or: query.$or }
                ];
                delete query.branchId;
                delete query.$or;
            }
        } else if (req.user.role === 'team_leader') {
            // Team Leaders see candidates in their branch AND their domain
            // Use regex for flexible matching (case-insensitive, trimmed)
            if (req.user.team) {
                query.assignedTeam = { $regex: new RegExp(`^\\s*${req.user.team.trim()}\\s*$`, 'i') };
            }
        }

        // Admin sees everything (no filter)

        const referrals = await Referral.find(query)
            .populate('job', 'jobTitle companyName domain')
            .populate('referrer', 'name email role')
            .populate('assignedEmployee', 'name email')
            .populate('branchId', 'name')
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

            // --- START INCENTIVE LOGIC ---
            const IncentiveRule = require('../models/IncentiveRule');
            const IncentiveLog = require('../models/IncentiveLog');

            let event = null;
            if (status === 'Interview Attended') event = 'Interview';
            else if (status === 'Selected') event = 'Selection';
            else if (status === 'Joined') event = 'Joining';

            if (event) {
                // 1. Employee Incentives (Assigned Recruiter)
                if (referral.assignedEmployee) {
                    const rule = await IncentiveRule.findOne({ role: 'employee', event, status: 'active' });
                    if (rule) {
                        await IncentiveLog.create({
                            user: referral.assignedEmployee,
                            referral: referral._id,
                            rule: rule._id,
                            amount: rule.amount,
                            event,
                            branchId: referral.branchId
                        });
                    }
                }

                // 2. Referrer Incentives (Agent/Employee) - ONLY ON JOINING
                if (status === 'Joined' && referral.referrer) {
                    const User = require('../models/User');
                    const referrer = await User.findById(referral.referrer);
                    if (referrer) {
                        const rule = await IncentiveRule.findOne({ 
                            role: referrer.role === 'agent' ? 'agent' : 'employee', 
                            event: 'Joining', 
                            status: 'active' 
                        });
                        if (rule) {
                            await IncentiveLog.create({
                                user: referrer._id,
                                referral: referral._id,
                                rule: rule._id,
                                amount: rule.amount,
                                event: 'Joining',
                                branchId: referral.branchId
                            });
                        }
                    }
                }
            }
            // --- END INCENTIVE LOGIC ---

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
        
        // 1. Branch Segregation
        if (req.user.role !== 'admin') {
            query.branchId = req.user.branchId;
        }

        // 2. Role Filtering
        if (req.user.role === 'agent') {
            query.referrer = req.user.id;
        } else if (req.user.role === 'employee') {
            query.$or = [
                { referrer: req.user.id },
                { assignedEmployee: req.user.id }
            ];
            if (query.branchId) {
                query.$and = [
                    { branchId: query.branchId },
                    { $or: query.$or }
                ];
                delete query.branchId;
                delete query.$or;
            }
        } else if (req.user.role === 'team_leader') {
            // Team Leaders only see their domain's stats within their branch
            if (req.user.team) {
                query.assignedTeam = { $regex: new RegExp(`^\\s*${req.user.team.trim()}\\s*$`, 'i') };
            }
        }

        const stats = await Referral.aggregate([
            { $match: query },
            {
                $facet: {
                    statusCounts: [
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ],
                    teamPerformance: [
                        { $match: { assignedTeam: { $ne: null } } },
                        { $group: { _id: "$assignedTeam", count: { $sum: 1 } } }
                    ],
                    employeePerformance: [
                        { $match: { assignedEmployee: { $ne: null } } },
                        { $group: { _id: "$assignedEmployee", count: { $sum: 1 } } },
                        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
                        { $unwind: '$user' },
                        { $project: { name: '$user.name', count: 1 } },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    agentPerformance: [
                        { $match: { sourceType: 'agent', referrer: { $ne: null } } },
                        { $group: { _id: "$referrer", count: { $sum: 1 } } },
                        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
                        { $unwind: '$user' },
                        { $project: { name: '$user.name', count: 1 } },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    followUpCounts: [
                        { $unwind: "$followUps" },
                        { $match: { "followUps.completed": false } },
                        { $group: { _id: null, count: { $sum: 1 } } }
                    ]
                }
            }
        ]);

        const activeJobs = await Job.countDocuments({ status: 'active', visibility: true });

        // Format Aggregation Results
        const raw = stats[0];
        const statusMap = {};
        raw.statusCounts.forEach(s => statusMap[s._id] = s.count);

        const result = {
            totalCandidates: raw.statusCounts.reduce((acc, s) => acc + s.count, 0),
            newLeads: statusMap['New Referral'] || 0,
            followUpsPending: raw.followUpCounts[0]?.count || 0,
            interviewsScheduled: statusMap['Interview Scheduled'] || 0,
            interviewCount: (statusMap['Interview Scheduled'] || 0) + (statusMap['Interview Attended'] || 0),
            selectedCount: statusMap['Selected'] || 0,
            shortlistedCount: statusMap['Shortlisted'] || 0,
            hiredCount: statusMap['Joined'] || 0,
            rejectedCount: statusMap['Rejected'] || 0,
            activeJobs,
            teamPerformance: raw.teamPerformance,
            employeePerformance: raw.employeePerformance,
            agentPerformance: raw.agentPerformance
        };

        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get Branch Specific Activity
// Route: GET /api/referrals/branch-activity
exports.getBranchActivity = async (req, res) => {
    try {
        let branchId = req.query.branchId;
        if (req.user.role !== 'admin') {
            branchId = req.user.branchId;
        }

        const query = branchId ? { branchId } : {};

        // Fetch recent activities from within Referral records
        const activities = await Referral.aggregate([
            { $match: query },
            { $unwind: "$activityLogs" },
            { $sort: { "activityLogs.timestamp": -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'activityLogs.user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $project: {
                    candidateName: 1,
                    action: "$activityLogs.action",
                    timestamp: "$activityLogs.timestamp",
                    userName: { $arrayElemAt: ["$user.name", 0] }
                }
            }
        ]);

        res.status(200).json({ success: true, data: activities });
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
