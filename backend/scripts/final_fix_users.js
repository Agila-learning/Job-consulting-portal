const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Branch = require('../models/Branch');

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        // 1. Ensure Bangalore branch exists
        let bangalore = await Branch.findOne({ name: 'Bangalore' });
        if (!bangalore) {
            bangalore = await Branch.create({ name: 'Bangalore', location: 'Bangalore, KA' });
        }
        console.log('Bangalore branch ID:', bangalore._id);

        // 2. Fix Admin (from .env)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@forgeindiaconnect.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Forgeindia@09';
        
        let admin = await User.findOne({ email: adminEmail });
        if (admin) {
            console.log('Updating existing admin user...');
            admin.role = 'admin';
            admin.status = 'active';
            admin.password = adminPassword;
            admin.branchId = bangalore._id;
            await admin.save();
        } else {
            console.log('Creating new admin user...');
            await User.create({
                name: 'Master Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                status: 'active',
                branchId: bangalore._id
            });
        }

        // 3. Fix all other users (assign to Bangalore if missing branch)
        const users = await User.find({ branchId: { $exists: false } });
        console.log(`Found ${users.length} users with missing branchId. Assigning to Bangalore...`);
        for (let user of users) {
             user.branchId = bangalore._id;
             user.status = 'active';
             await user.save();
             console.log(`Updated user: ${user.email}`);
        }

        // 4. Specifically ensure employees are active
        const employees = await User.find({ role: 'employee' });
        for (let emp of employees) {
            if (emp.status !== 'active') {
                emp.status = 'active';
                await emp.save();
                console.log(`Self-Correction: Activated employee ${emp.email}`);
            }
        }

        console.log('Cleanup and Fix Completed Successfuly!');
        process.exit(0);
    } catch (err) {
        console.error('Fix failed:', err);
        process.exit(1);
    }
};

fix();
