const mongoose = require('mongoose');

const incentivePaymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    logs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'IncentiveLog' }],
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Paid'], 
        default: 'Pending' 
    },
    paymentDate: { type: Date },
    transactionId: { type: String },
    remarks: { type: String },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }
}, { timestamps: true });

module.exports = mongoose.model('IncentivePayment', incentivePaymentSchema);
