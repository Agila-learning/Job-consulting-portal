const User = require('../models/User');
const Job = require('../models/Job');
const Referral = require('../models/Referral');

// Get dashboard summary based on role
// Route: GET /api/dashboard/summary
exports.getDashboardSummary = async (req, res) => {
    try {
        const { role, id: userId, branchId: userBranchId } = req.user;
        let stats = {};
        let baseQuery = {};

        // Apply Branch Segregation
        if (role !== 'admin') {
            baseQuery.branchId = userBranchId;
        }

        // 1. Basic Counts & Role-Specific Stats
        if (role === 'admin') {
            stats.totalJobs = await Job.countDocuments({ status: { $ne: 'deleted' } });
            stats.totalReferrals = await Referral.countDocuments();
            stats.pendingAgents = await User.countDocuments({ role: 'agent', status: 'pending' });
            stats.activeConsultants = await User.countDocuments({ role: 'employee', status: 'active' });
            
            // Financials
            const financialStats = await Referral.aggregate([
                { $match: { status: 'Joined' } },
                { $group: { _id: null, total: { $sum: { $toDouble: "$calculatedCommission" } }, count: { $sum: 1 } } }
            ]);
            stats.totalRevenuePool = financialStats[0]?.total || 0;
            stats.successfulPlacements = financialStats[0]?.count || 0;

        } else if (role === 'team_leader') {
            // TL sees aggregate for their specific branch and domain
            const tlQuery = { branchId: userBranchId };
            if (req.user.team) {
                tlQuery.assignedTeam = { $regex: new RegExp(`^\\s*${req.user.team.trim()}\\s*$`, 'i') };
            }
            
            stats.activeJobs = await Job.countDocuments({ status: 'active', domain: req.user.team });
            stats.totalPipeline = await Referral.countDocuments(tlQuery);
            stats.teamPlacements = await Referral.countDocuments({ ...tlQuery, status: 'Joined' });
            
            const pipelineValue = await Referral.aggregate([
                { $match: { ...tlQuery, status: 'Joined' } },
                { $group: { _id: null, total: { $sum: { $toDouble: "$calculatedCommission" } } } }
            ]);
            stats.managedValue = pipelineValue[0]?.total || 0;

        } else if (role === 'employee') {
            stats.assignedCandidates = await Referral.countDocuments({ assignedEmployee: userId, branchId: userBranchId });
            stats.mySubmissions = await Referral.countDocuments({ referrer: userId, branchId: userBranchId });
            stats.activeJobs = await Job.countDocuments({ status: 'active' });
            
            const myPlacements = await Referral.aggregate([
                { $match: { assignedEmployee: userId, status: 'Joined', branchId: userBranchId } },
                { $group: { _id: null, total: { $sum: { $toDouble: "$calculatedCommission" } }, count: { $sum: 1 } } }
            ]);
            stats.successfulPlacements = myPlacements[0]?.count || 0;
            stats.accruedIncentives = myPlacements[0]?.total || 0;

        } else if (role === 'agent') {
            stats.myReferrals = await Referral.countDocuments({ referrer: userId });
            stats.activeJobs = await Job.countDocuments({ status: 'active', visibility: true });
            
            const myEarnings = await Referral.aggregate([
                { $match: { referrer: userId, status: 'Joined' } },
                { $group: { _id: null, total: { $sum: { $toDouble: "$calculatedCommission" } }, count: { $sum: 1 } } }
            ]);
            stats.successfulPlacements = myEarnings[0]?.count || 0;
            stats.totalEarnings = myEarnings[0]?.total || 0;
        }

        // 2. Referrals by Status (Distribution)
        let statusQuery = { ...baseQuery };
        if (role === 'employee' || role === 'agent') {
            statusQuery = { 
                ...statusQuery,
                $or: [{ referrer: userId }, { assignedEmployee: userId }] 
            };
        }
        
        const statusDistribution = await Referral.aggregate([
            { $match: statusQuery },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // 3. Referrals by Date (Time Series - Last 14 days for higher density)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        
        const timeSeries = await Referral.aggregate([
            { $match: { ...statusQuery, createdAt: { $gte: fourteenDaysAgo } } },
            { $group: { 
                _id: { $dateToString: { format: "%m-%d", date: "$createdAt" } }, 
                count: { $sum: 1 } 
            }},
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({ 
            success: true, 
            data: { 
                stats, 
                statusDistribution: statusDistribution.map(s => ({ name: s._id, value: s.count })),
                timeSeries: timeSeries.map(t => ({ date: t._id, count: t.count }))
            } 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
