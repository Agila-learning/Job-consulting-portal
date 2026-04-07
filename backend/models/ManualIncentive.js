const mongoose = require('mongoose');

const manualIncentiveSchema = new mongoose.Schema({
    recipient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: function() { return this.type !== 'team'; }
    },
    amount: { type: Number, required: true },
    type: { 
        type: String, 
        enum: ['individual', 'team', 'agent'], 
        default: 'individual' 
    },
    reason: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'paid'], 
        default: 'pending' 
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ManualIncentive', manualIncentiveSchema);
