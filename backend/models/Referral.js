const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    candidateName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    resumeUrl: { type: String },
    currentLocation: { type: String },
    preferredLocation: { type: String },
    experience: { type: String },
    currentCompany: { type: String },
    currentSalary: { type: String },
    expectedSalary: { type: String },
    noticePeriod: { type: String },
    skills: { type: [String] },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    sourceType: { type: String, enum: ['employee', 'agent', 'self'], required: true },
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    assignedTeam: { type: String }, // e.g. IT, BDA, HR
    status: { 
        type: String, 
        enum: [
            'New Referral', 'Under Review', 'Assigned', 'Contacted', 'Interested', 
            'Not Interested', 'Screening Done', 'Shortlisted', 'Interview Scheduled', 
            'Interview Attended', 'Selected', 'Offer Released', 'Joined', 'Rejected', 
            'Hold', 'Dropped'
        ], 
        default: 'New Referral' 
    },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String },
        timestamp: { type: Date, default: Date.now },
        type: { type: String, enum: ['admin', 'employee', 'agent', 'screening', 'follow-up', 'interview', 'rejection'], default: 'admin' }
    }],
    activityLogs: [{
        action: { type: String },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
    }],
    additionalComments: { type: String },
    joiningDate: { type: Date },
    
    // CRM Features
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    candidateTags: { type: [String], default: [] },
    followUps: [{
        title: { type: String },
        date: { type: Date },
        completed: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    dropReason: { type: String },
    
    // Financial Tracking
    totalCalls: { type: Number, default: 0 },
    calculatedCommission: { type: String }, // Locked in amount
    payoutStatus: { 
        type: String, 
        enum: ['unearned', 'pending_approval', 'processing', 'paid', 'declined'], 
        default: 'unearned' 
    },
    agentInvoiceUrl: { type: String }, // Optional invoice upload
    payoutNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Referral', referralSchema);
