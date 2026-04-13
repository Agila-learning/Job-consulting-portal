const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

async function fixRoles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Fix Madhu - Ensure role is team_leader
        const madhuResult = await User.updateMany(
            { name: /Madhu/i },
            { $set: { role: 'team_leader' } }
        );
        console.log('Madhu role update:', madhuResult);

        // Optional: Ensure other obvious TLs are correctly set if needed
        // For now, focusing on the user reported issue

        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

fixRoles();
