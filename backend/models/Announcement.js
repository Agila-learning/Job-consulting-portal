const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'], 
        default: 'medium' 
    },
    targetRoles: { 
        type: [String], 
        enum: ['admin', 'employee', 'agent', 'team_leader', 'all'],
        default: ['all']
    },
    branchId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Branch' // Optional: null means global
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
