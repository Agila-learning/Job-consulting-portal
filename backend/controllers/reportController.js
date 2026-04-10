const Referral = require('../models/Referral');
const User = require('../models/User');
const Branch = require('../models/Branch');
const mongoose = require('mongoose');

// Get Performance Reports (Aggregated KPIs)
// Route: GET /api/reports/performance
exports.getPerformanceReports = async (req, res) => {
    try {
        const { range, branchId } = req.query;
        let query = {};

        // 1. Branch Filter
        if (req.user.role !== 'admin') {
            query.branchId = req.user.branchId;
        } else if (branchId && branchId !== 'all') {
            query.branchId = new mongoose.Types.ObjectId(branchId);
        }

        // 2. Time Range Filter
        const now = new Date();
        let startDate = new Date(0); // Default to all time

        if (range === 'daily') {
            startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (range === 'weekly') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
            startDate = new Date(now.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
        } else if (range === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        query.createdAt = { $gte: startDate };

        // 3. Aggregate Stats
        const stats = await Referral.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalCalls: { $sum: { $ifNull: ["$totalCalls", 0] } },
                    totalCandidates: { $sum: 1 },
                    shortlisted: { $sum: { $cond: [{ $eq: ["$status", "Shortlisted"] }, 1, 0] } },
                    selected: { $sum: { $cond: [{ $eq: ["$status", "Selected"] }, 1, 0] } },
                    joined: { $sum: { $cond: [{ $eq: ["$status", "Joined"] }, 1, 0] } }
                }
            }
        ]);

        const result = stats[0] || {
            totalCalls: 0,
            totalCandidates: 0,
            shortlisted: 0,
            selected: 0,
            joined: 0
        };

        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get Top Performers
// Route: GET /api/reports/top-performers
exports.getTopPerformers = async (req, res) => {
    try {
        const { range, branchId, metric = 'conversions' } = req.query;
        let query = {};

        // 1. Branch Filter
        if (req.user.role !== 'admin') {
            query.branchId = req.user.branchId;
        } else if (branchId && branchId !== 'all') {
            query.branchId = new mongoose.Types.ObjectId(branchId);
        }

        // 2. Time Range Filter
        const now = new Date();
        let startDate = new Date(0);
        if (range === 'daily') startDate = new Date(now.setHours(0, 0, 0, 0));
        else if (range === 'weekly') {
            const tempDate = new Date();
            const diff = tempDate.getDate() - tempDate.getDay() + (tempDate.getDay() === 0 ? -6 : 1);
            startDate = new Date(tempDate.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
        } else if (range === 'monthly') startDate = new Date(now.getFullYear(), now.getMonth(), 1);

        query.createdAt = { $gte: startDate };

        // 3. Metric Specific Filter (Optional for some metrics)
        if (metric === 'conversions') {
            query.status = 'Joined';
        } else if (metric === 'shortlisted') {
            query.status = 'Shortlisted';
        }
        // 'referrals' metric doesn't need a status filter

        const performers = await Referral.aggregate([
            { $match: query },
            { $match: { assignedEmployee: { $ne: null } } },
            {
                $group: {
                    _id: "$assignedEmployee",
                    count: { $sum: 1 },
                    branchId: { $first: "$branchId" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: 'branches',
                    localField: 'branchId',
                    foreignField: '_id',
                    as: 'branch'
                }
            },
            { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    name: "$user.name",
                    email: "$user.email",
                    count: 1,
                    branch: "$branch.name",
                    metric: { $literal: metric }
                }
            }
        ]);

        res.status(200).json({ success: true, data: performers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
