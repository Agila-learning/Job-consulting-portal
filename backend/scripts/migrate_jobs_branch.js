const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Job = require('../models/Job');
const Branch = require('../models/Branch');

const fixJobs = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const bangalore = await Branch.findOne({ name: 'Bangalore' });
        if (!bangalore) {
            console.error('Bangalore branch not found!');
            process.exit(1);
        }
        const result = await Job.updateMany(
            { branchId: { $exists: false } },
            { $set: { branchId: bangalore._id } }
        );
        console.log(`Successfully assigned ${result.modifiedCount} jobs to Bangalore branch.`);
        process.exit(0);
    } catch (err) {
        console.error('Fix failed:', err);
        process.exit(1);
    }
};

fixJobs();
