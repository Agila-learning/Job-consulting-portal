const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    jobTitle: { type: String, required: true },
    companyName: { type: String, required: true },
    companyLogo: { type: String },
    companyWebsite: { type: String },
    companyAddress: { type: String },
    tagLine: { type: String },
    salary: { type: String },
    location: { type: String },
    domain: { type: String, required: true },
    subdomain: { type: String }, // e.g. Backend, Frontend, Sales Ops
    activeDate: { type: Date, default: Date.now },
    lastDate: { type: Date },
    rolesAndResponsibilities: { type: String },
    skillsRequired: { type: [String] }, // Detailed list
    qualification: { type: String },
    experienceRequired: { type: String },
    fresherOnly: { type: Boolean, default: false },
    shiftTiming: { type: String }, // e.g. Day Shift, Night Shift
    aboutCompany: { type: String },
    jobType: { type: String, enum: ['full-time', 'part-time', 'contract', 'freelance'], default: 'full-time' },
    workMode: { type: String, enum: ['remote', 'office', 'hybrid'], default: 'office' },
    openings: { type: Number, default: 1 },
    hiringPriority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    visibility: { type: Boolean, default: true },
    recruiterNotes: { type: String },
    domainSpecificForm: { type: mongoose.Schema.Types.Mixed }, // Flexible fields based on domain
    status: { type: String, enum: ['draft', 'active', 'paused', 'closed'], default: 'active' },
    
    // Financials
    incentiveAgent: { type: String }, // Flexible amount/description
    incentiveEmployee: { type: String },
    incentiveSlab: { type: String }, // Detailed conditions
    
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
