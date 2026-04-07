const mongoose = require('mongoose');

const scriptSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a script title'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Please specify a category'],
        enum: ['Initial Outreach', 'Screening', 'Technical Pitch', 'Closure Pitch', 'Onboarding'],
        default: 'Initial Outreach'
    },
    type: {
        type: String,
        required: [true, 'Please specify script type'],
        enum: ['text', 'file'],
        default: 'text'
    },
    content: {
        type: String,
        trim: true
    },
    fileUrl: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Script', scriptSchema);
