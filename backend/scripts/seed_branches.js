const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Branch = require('../models/Branch');

const branches = [
    { name: 'Bangalore', location: 'Karnataka', status: 'active' },
    { name: 'Chennai', location: 'Tamil Nadu', status: 'active' },
    { name: 'Krishnagiri', location: 'Tamil Nadu', status: 'active' },
    { name: 'Thirupattur', location: 'Tamil Nadu', status: 'active' }
];

async function seedBranches() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const b of branches) {
            const exists = await Branch.findOne({ name: b.name });
            if (!exists) {
                await Branch.create(b);
                console.log(`Created branch: ${b.name}`);
            } else {
                exists.status = 'active';
                await exists.save();
                console.log(`Updated branch: ${b.name}`);
            }
        }

        console.log('Branch seeding complete');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seedBranches();
