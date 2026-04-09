const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Branch = require('../models/Branch');
const User = require('../models/User');
const Referral = require('../models/Referral');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for migration...');

        // 1. Create Default Branches
        const branches = [
            { name: 'Bangalore', location: 'Bangalore, KA' },
            { name: 'Chennai', location: 'Chennai, TN' },
            { name: 'Krishnagiri', location: 'Krishnagiri, TN' }
        ];

        console.log('Ensuring branches exist...');
        const branchDocs = [];
        for (const b of branches) {
            let doc = await Branch.findOne({ name: b.name });
            if (!doc) {
                doc = await Branch.create(b);
                console.log(`Created branch: ${b.name}`);
            } else {
                console.log(`Branch already exists: ${b.name}`);
            }
            branchDocs.push(doc);
        }

        const defaultBranch = branchDocs.find(b => b.name === 'Bangalore');

        // 2. Migrate Users
        console.log('Migrating users to default branch (Bangalore)...');
        const userResult = await User.updateMany(
            { branchId: { $exists: false } },
            { $set: { branchId: defaultBranch._id } }
        );
        console.log(`Updated ${userResult.modifiedCount} users.`);

        // 3. Migrate Referrals
        console.log('Migrating referrals to default branch (Bangalore)...');
        const referralResult = await Referral.updateMany(
            { branchId: { $exists: false } },
            { $set: { branchId: defaultBranch._id } }
        );
        console.log(`Updated ${referralResult.modifiedCount} referrals.`);

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
