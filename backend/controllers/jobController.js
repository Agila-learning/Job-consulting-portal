const Job = require('../models/Job');

// Get all jobs with optional filtering
// Route: GET /api/jobs
exports.getJobs = async (req, res) => {
    try {
        const { status, role } = req.query;
        let query = {};
        
        // 1. Core Filtering
        if (req.user.role !== 'admin') {
            query.status = 'active';
            query.visibility = true;
            
            // Internal staff can see all active mandates for recruitment
            // branchId filtering removed to allow cross-branch referrals as requested
        } else if (status) {
            query.status = status;
        }

        const jobs = await Job.find(query).populate('branchId', 'name').sort('-createdAt');
        
        res.status(200).json({ success: true, count: jobs.length, data: jobs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get single job
// Route: GET /api/jobs/:id
exports.getJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('branchId', 'name');

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        res.status(200).json({ success: true, data: job });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Create a new job (Admin only)
// Route: POST /api/jobs
exports.createJob = async (req, res) => {
    try {
        req.body.createdBy = req.user.id;
        
        // Inherit branch if not provided (Admins can specify, others inherit)
        if (!req.body.branchId) {
            req.body.branchId = req.user.branchId;
        }

        const job = await Job.create(req.body);
        res.status(201).json({ success: true, data: job });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Update job (Admin only)
// Route: PATCH /api/jobs/:id
exports.updateJob = async (req, res) => {
    try {
        let job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        job = await Job.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: job });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete Job (Admin only)
// Route: DELETE /api/jobs/:id
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const isHardDelete = req.query.hard === 'true';

        if (isHardDelete) {
            await job.deleteOne();
            return res.status(200).json({ success: true, message: 'Job purged from database' });
        }

        // Default to soft delete: update status to 'closed'
        job.status = 'closed';
        await job.save();

        res.status(200).json({ success: true, data: job, message: 'Job marked as closed' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
