const Script = require('../models/Script');

// @desc    Get all scripts
// @route   GET /api/scripts
// @access  Private (Admin/Employee)
exports.getScripts = async (req, res) => {
    try {
        const scripts = await Script.find().populate('createdBy', 'name');
        res.status(200).json({
            success: true,
            data: scripts
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create new script
// @route   POST /api/scripts
// @access  Private (Admin)
exports.createScript = async (req, res) => {
    try {
        req.body.createdBy = req.user.id;
        const script = await Script.create(req.body);
        res.status(201).json({
            success: true,
            data: script
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// @desc    Delete script
// @route   DELETE /api/scripts/:id
// @access  Private (Admin)
exports.deleteScript = async (req, res) => {
    try {
        const script = await Script.findById(req.params.id);

        if (!script) {
            return res.status(404).json({
                success: false,
                message: 'Script not found'
            });
        }

        await Script.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
