const mongoose = require('mongoose');

const performanceLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    callsCount: {
        type: Number,
        default: 0
    },
    conversionsCount: {
        type: Number,
        default: 0
    },
    rejectionsCount: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        trim: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure a user can only submit one log per day
performanceLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('PerformanceLog', performanceLogSchema);
