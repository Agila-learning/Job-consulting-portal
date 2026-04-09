const mongoose = require('mongoose');

const incentiveLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    referral: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', required: true },
    rule: { type: mongoose.Schema.Types.ObjectId, ref: 'IncentiveRule' },
    amount: { type: Number, required: true },
    event: { type: String, required: true }, // Interview, Selection, Joining
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    status: { type: String, enum: ['generated', 'payout_created'], default: 'generated' }
}, { timestamps: true });

module.exports = mongoose.model('IncentiveLog', incentiveLogSchema);
