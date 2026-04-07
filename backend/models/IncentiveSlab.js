const mongoose = require('mongoose');

const incentiveSlabSchema = new mongoose.Schema({
    title: { type: String, required: true },
    targetType: { type: String, enum: ['individual', 'team'], default: 'individual' },
    domain: { type: String, required: true }, // IT, Non-IT, etc.
    userRole: { type: String, enum: ['employee', 'agent'], required: true },
    
    thresholds: [{
        count: { type: Number, required: true }, // e.g. 5 joined candidates
        rewardType: { type: String, enum: ['cash', 'gift', 'award', 'bonus'], default: 'cash' },
        rewardValue: { type: String, required: true }, // e.g. "5000", "Smartphone", "Certificate"
        description: { type: String }
    }],

    specialOffers: [{
        title: { type: String },
        expiryDate: { type: Date },
        bonusMultiplier: { type: Number, default: 1 }
    }],

    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('IncentiveSlab', incentiveSlabSchema);
