const Referral = require('../models/Referral');
const Job = require('../models/Job');
const KYC = require('../models/KYC');
const IncentiveSlab = require('../models/IncentiveSlab');
const Branch = require('../models/Branch');
const mongoose = require('mongoose');
const { sendNotification } = require('../utils/notificationHelper');

// Create a new referral
// Route: POST /api/referrals
exports.createReferral = async (req, res) => {
    try {
        const User = require('../models/User');
        const Branch = require('../models/Branch');

        // 1. Check if job exists
        const { jobId } = req.body;
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        // 2. Data Normalization
        let { skills, ...candidateData } = req.body;
        
        // Handle skills string/array transformation
        let normalizedSkills = [];
        if (skills) {
            if (typeof skills === 'string') {
                normalizedSkills = skills.split(',').map(s => s.trim()).filter(Boolean);
            } else if (Array.isArray(skills)) {
                normalizedSkills = skills.map(s => s.toString().trim()).filter(Boolean);
            }
        }

        // Determine Branch with Intelligent Mapping
        let branchId = req.body.branchId || req.user.branchId; 
        
        if (candidateData.preferredLocation && !branchId) {
            const loc = candidateData.preferredLocation.toLowerCase();
            const mapping = [
                { branch: 'Bangalore', keywords: ['bangalore', 'bengaluru', 'madiwala', 'ecity', 'karnataka', 'ka', 'whitefield'] },
                { branch: 'Chennai', keywords: ['chennai', 'madras', 'tn', 'tamil nadu', 'adyar', 'velachery', 'guindy'] },
                { branch: 'Krishnagiri', keywords: ['krishnagiri', 'hosur', 'dharmapuri'] },
                { branch: 'Thirupattur', keywords: ['thirupattur', 'tp', 'vaniyambadi', 'jolarpettai'] }
            ];

            const foundMapping = mapping.find(m => m.keywords.some(k => loc.includes(k)));
            if (foundMapping) {
                const branchObj = await Branch.findOne({ name: foundMapping.branch });
                if (branchObj) branchId = branchObj._id;
            }
        }

        if (!branchId) {
            const defaultBranch = await Branch.findOne({});
            if (defaultBranch) branchId = defaultBranch._id;
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

        // Special Attribution: If Agent was referred by an Employee
        if (req.user.role === 'agent' && req.user.referredBy) {
            assignedEmployee = req.user.referredBy;
        }

        // Handle persistent resume upload
        let resumeUrl = candidateData.resumeUrl || '';
        if (req.file) {
            resumeUrl = `/uploads/resumes/${req.file.filename}`;
        }

        // 4. Create Referral
        const referral = await Referral.create({
            ...candidateData,
            skills: normalizedSkills,
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

exports.getReferrals = async (req, res) => {
    try {
        let query = {};

        // 1. Branch Segregation
        const { branchId } = req.query;
        if (req.user.role === 'agent') {
            query.referrer = req.user.id;
        } else if (req.user.role !== 'admin') {
            if (!req.user.branchId) {
                // Dummy ID to isolate users without a branch, but we'll bypass this for assignments
                query.branchId = "000000000000000000000000"; 
            } else {
                query.branchId = req.user.branchId;
            }
        } else if (branchId && branchId !== 'all') {
            query.branchId = branchId;
        }

        // 2. Role-based data visibility
        if (req.user.role === 'employee') {
            // Employees see what they referred OR what is assigned to them
            const selfInterestQuery = {
                $or: [
                    { referrer: req.user.id },
                    { assignedEmployee: req.user.id }
                ]
            };

            if (query.branchId) {
                // Priority: If the candidate is directly assigned to them, 
                // they should see it regardless of branch isolation status
                if (query.branchId === "000000000000000000000000") {
                    Object.assign(query, selfInterestQuery);
                    delete query.branchId;
                } else {
                    query.$and = [
                        { branchId: query.branchId },
                        selfInterestQuery
                    ];
                    delete query.branchId;
                }
            } else {
                Object.assign(query, selfInterestQuery);
            }
        } else if (req.user.role === 'team_leader') {
            // Team Leaders see ALL candidates in their branch as requested
            // Domain restriction (assignedTeam) is removed for full branch visibility
        }

        const referrals = await Referral.find(query)
            .populate('job', 'jobTitle companyName domain')
            .populate('referrer', 'name email role')
            .populate('assignedEmployee', 'name email')
            .populate('branchId', 'name')
            .sort('-updatedAt');
        
        res.status(200).json({ success: true, count: referrals.length, data: referrals });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Assign referral to employee (Admin & Team Leader)
// Route: PATCH /api/referrals/:id/assign
exports.assignReferral = async (req, res) => {
    try {
        const { employeeId } = req.body;
        const referral = await Referral.findById(req.params.id);

        if (!referral) {
            return res.status(404).json({ success: false, message: 'Referral not found' });
        }

        // TL Authorization: Can only assign if candidate is in their branch
        if (req.user.role === 'team_leader' && referral.branchId?.toString() !== req.user.branchId?.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized to assign candidates outside your branch.' });
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
        if (io && employeeId) {
            io.to(employeeId).emit('assignmentNotification', {
                message: `New candidate ${referral.candidateName} assigned to you`,
                referralId: referral._id
            });
        }
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

        // Permission check: admin, team_leader (of same branch), or assigned employee
        const userRole = req.user.role;
        const userId = req.user.id.toString();
        const assignedId = referral.assignedEmployee?.toString();
        const isBranchMatch = referral.branchId?.toString() === req.user.branchId?.toString();
        
        const isAuthorized = userRole === 'admin' || 
                           (userRole === 'team_leader' && isBranchMatch) || 
                           assignedId === userId;
                           
        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this referral' });
        }

        // Branch Isolation Check for Team Leaders
        if (userRole !== 'admin' && referral.branchId && referral.branchId.toString() !== (req.user.branchId ? req.user.branchId.toString() : '')) {
            return res.status(403).json({ success: false, message: 'Cross-branch data modification prohibited' });
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
                    
                    // Special Rule: If Agent was referred by an Employee, Agent gets NO incentive 
                    // (The incentive was already credited to the referring employee in step 1)
                    if (referrer && referrer.role === 'agent' && referrer.referredBy) {
                        console.log(`[INCENTIVE] Suppressing Agent incentive for ${referrer.name} - credited to referred Employee.`);
                    } else if (referrer) {
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

            // Real-time Notification Dispatch
            if (referral.referrer) {
                await sendNotification(req.app, {
                    userId: referral.referrer,
                    title: 'Candidate Progress Update',
                    message: `Progress: ${referral.candidateName} is now [${status}]`,
                    type: status === 'Joined' ? 'success' : 'info',
                    link: `/${req.user.role === 'agent' ? 'agent' : req.user.role === 'employee' ? 'employee' : 'admin'}/pipeline`
                });
            }

            // Notify Admin for High-Value Transitions
            if (status === 'Selected' || status === 'Joined') {
                const User = require('../models/User');
                const admins = await User.find({ role: 'admin' });
                
                for (const admin of admins) {
                    await sendNotification(req.app, {
                        userId: admin._id,
                        title: `Revenue Milestone: ${status}`,
                        message: `Critical Transition: ${referral.candidateName} has reached [${status}] stage.`,
                        type: status === 'Joined' ? 'success' : 'info',
                        link: '/admin/dashboard'
                    });
                }
            }
        }

        if (comment) {
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

        // Branch Isolation Check
        if (req.user.role !== 'admin' && referral.branchId && referral.branchId.toString() !== (req.user.branchId ? req.user.branchId.toString() : '')) {
            return res.status(403).json({ success: false, message: 'Cross-branch data modification prohibited' });
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

        const query = { _id: { $in: ids } };
        if (req.user.role !== 'admin') {
            query.branchId = req.user.branchId;
        }

        await Referral.updateMany(
            query,
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
        
        // 1. Branch Segregation (Agent Bypass)
        const { branchId } = req.query;
        if (req.user.role === 'agent') {
            query.referrer = req.user.id;
        } else if (req.user.role !== 'admin') {
            if (!req.user.branchId) {
                query.branchId = "000000000000000000000000";
            } else {
                query.branchId = req.user.branchId;
            }
        } else if (branchId && branchId !== 'all') {
            query.branchId = branchId;
        }

        // 2. Role Filtering (Remaining)
        if (req.user.role === 'employee') {
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
            // Team Leaders only see their branch's stats (full branch as requested)
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
        
        // Role-based activity isolation
        if (req.user.role === 'employee' || req.user.role === 'agent') {
            query.$or = [
                { referrer: req.user.id },
                { assignedEmployee: req.user.id }
            ];
        } else if (req.user.role === 'team_leader' && req.user.team) {
            // Optional: Further restrict TLs to their domain activity if needed
            // Currently they see all activity in their branch as requested
        }

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

        // Branch Isolation Check
        if (req.user.role !== 'admin' && referral.branchId && referral.branchId.toString() !== (req.user.branchId ? req.user.branchId.toString() : '')) {
            return res.status(403).json({ success: false, message: 'Not authorized to purge cross-branch records' });
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

// Increment calls made (Activity Tracking)
// Route: PATCH /api/referrals/:id/increment-calls
exports.incrementCalls = async (req, res) => {
    try {
        const referral = await Referral.findById(req.params.id);
        if (!referral) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        referral.totalCalls = (referral.totalCalls || 0) + 1;
        referral.activityLogs.push({
            action: 'Outbound call logged',
            user: req.user.id
        });

        await referral.save();
        res.status(200).json({ success: true, count: referral.totalCalls });
    } catch (err) {
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
