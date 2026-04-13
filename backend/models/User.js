const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // Optional but unique
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'employee', 'agent', 'team_leader'], required: true },
    status: { type: String, enum: ['pending', 'active', 'inactive', 'rejected'], default: 'active' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    
    // Employee Specific
    employeeId: { type: String },
    mobile: { 
        type: String, 
        required: true, 
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d{10}$/.test(v); // Exactly 10 digits
            },
            message: props => `${props.value} is not a valid 10-digit mobile number!`
        }
    },
    designation: { type: String },
    department: { type: String },
    team: { type: String }, // e.g. IT, Non-IT, Banking
    joiningDate: { type: Date },
    reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Agent Specific
    agencyName: { type: String },
    city: { type: String },
    location: { type: String },
    specialization: { type: [String] },
    experience: { type: String },
    kycStatus: { type: String, enum: ['not_started', 'pending', 'verified', 'rejected'], default: 'not_started' },
    kycVerifiedAt: { type: Date },
    
    profileImage: { type: String },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For Employee -> Agent referrals
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
