const PerformanceLog = require('../models/PerformanceLog');
const mongoose = require('mongoose');

// @desc    Create a daily performance log
// @route   POST /api/performance-logs
// @access  Private (Employee, Team Leader, Agent)
exports.createPerformanceLog = async (req, res) => {
    try {
        const { date, callsCount, conversionsCount, rejectionsCount, notes } = req.body;

        // Set date to start of day for consistency and uniqueness check
        const logDate = new Date(date || Date.now());
        logDate.setHours(0, 0, 0, 0);

        // Check if log already exists for this user and date
        const existingLog = await PerformanceLog.findOne({
            user: req.user.id,
            date: logDate
        });

        if (existingLog) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted a performance report for this date.'
            });
        }

        const log = await PerformanceLog.create({
            user: req.user.id,
            branchId: req.user.branchId,
            date: logDate,
            callsCount: callsCount || 0,
            conversionsCount: conversionsCount || 0,
            rejectionsCount: rejectionsCount || 0,
            notes
        });

        res.status(201).json({
            success: true,
            data: log
        });

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('newPerformanceLog', {
                message: `${req.user.name} logged daily productivity: ${callsCount} calls, ${conversionsCount} conversions`,
                userId: req.user.id,
                branchId: req.user.branchId
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get performance logs
// @route   GET /api/performance-logs
// @access  Private
exports.getPerformanceLogs = async (req, res) => {
    try {
        const { branchId, userId, startDate, endDate } = req.query;
        let query = {};

        // 1. Role-based Access Control
        if (req.user.role === 'admin') {
            if (branchId && branchId !== 'all') {
                query.branchId = branchId;
            }
            if (userId) {
                query.user = userId;
            }
        } else if (req.user.role === 'team_leader') {
            query.branchId = req.user.branchId;
            if (userId) {
                query.user = userId;
            }
        } else {
            // Employee / Agent sees only their own
            query.user = req.user.id;
        }

        // 2. Date Range Filtering
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const logs = await PerformanceLog.find(query)
            .populate('user', 'name role email')
            .populate('branchId', 'name')
            .sort({ date: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete a performance log
// @route   DELETE /api/performance-logs/:id
// @access  Private (Admin or Owner)
exports.deletePerformanceLog = async (req, res) => {
    try {
        const log = await PerformanceLog.findById(req.params.id);

        if (!log) {
            return res.status(404).json({ success: false, message: 'Log not found' });
        }

        // Only Admin or the user who created it can delete
        if (req.user.role !== 'admin' && log.user.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await log.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Performance log removed'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
