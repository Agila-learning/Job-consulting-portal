const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    aadhaarNumber: { type: String, required: true },
    aadhaarFront: { type: String },
    aadhaarBack: { type: String },
    panNumber: { type: String, required: true },
    panCard: { type: String },
    addressProof: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    accountHolderName: { type: String },
    photo: { type: String },
    businessProof: { type: String },
    status: { type: String, enum: ['pending', 'verified', 'rejected', 're-upload'], default: 'pending' },
    rejectionReason: { type: String },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('KYC', kycSchema);
