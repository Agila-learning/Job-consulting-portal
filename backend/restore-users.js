require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const restoreUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        const adminExists = await User.findOne({ email: 'admin@workforce.com' });
        if (!adminExists) {
            await User.create({
                name: 'Master Admin',
                email: 'admin@workforce.com',
                password: 'password123',
                role: 'admin',
                status: 'active'
            });
            console.log('Admin user restored: admin@workforce.com / password123');
        } else {
            console.log('Admin user already exists.');
        }

        const empExists = await User.findOne({ email: 'alex@workforce.com' });
        if (!empExists) {
            await User.create({
                name: 'Consultant Alex',
                email: 'alex@workforce.com',
                password: 'password123',
                role: 'employee',
                employeeId: 'FIC-EMP-001',
                status: 'active',
                designation: 'Senior Specialist'
            });
            console.log('Employee user restored: alex@workforce.com / password123');
        } else {
            console.log('Employee user already exists.');
        }

        const tlExists = await User.findOne({ email: 'tl@workforce.com' });
        if (!tlExists) {
            await User.create({
                name: 'Team Leader',
                email: 'tl@workforce.com',
                password: 'password123',
                role: 'team_leader',
                status: 'active'
            });
            console.log('Team Leader restored: tl@workforce.com / password123');
        }

        process.exit();
    } catch (err) {
        console.error('Failed to restore users:', err);
        process.exit(1);
    }
};

restoreUsers();
