const Announcement = require('../models/Announcement');

// @desc    Get active announcements for user
// @route   GET /api/announcements
// @access  Private
exports.getAnnouncements = async (req, res) => {
    try {
        const { role, branchId } = req.user;
        
        let query = {
            isActive: true,
            $or: [
                { targetRoles: 'all' },
                { targetRoles: role }
            ]
        };

        // Filter by branch if provided, or show global ones (branchId: null)
        if (branchId) {
            query.$and = [
                { $or: [{ branchId }, { branchId: null }] }
            ];
        } else {
            query.branchId = null;
        }

        const announcements = await Announcement.find(query)
            .populate('createdBy', 'name')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: announcements.length,
            data: announcements
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Admin)
exports.createAnnouncement = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only admins can post announcements' });
        }

        const announcement = await Announcement.create({
            ...req.body,
            createdBy: req.user.id
        });

        res.status(201).json({ success: true, data: announcement });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Toggle announcement status
// @route   PATCH /api/announcements/:id/toggle
// @access  Private (Admin)
exports.toggleAnnouncement = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        announcement.isActive = !announcement.isActive;
        await announcement.save();

        res.status(200).json({ success: true, data: announcement });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
