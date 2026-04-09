const mongoose = require('mongoose');

const incentiveRuleSchema = new mongoose.Schema({
    role: { type: String, enum: ['employee', 'agent'], required: true },
    event: { 
        type: String, 
        enum: ['Interview', 'Selection', 'Joining'], 
        required: true 
    },
    amount: { type: Number, required: true },
    description: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('IncentiveRule', incentiveRuleSchema);
