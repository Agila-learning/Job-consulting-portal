const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true,
        enum: ['Bangalore', 'Chennai', 'Krishnagiri'] 
    },
    location: { type: String },
    status: { 
        type: String, 
        enum: ['active', 'inactive'], 
        default: 'active' 
    },
    description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);
