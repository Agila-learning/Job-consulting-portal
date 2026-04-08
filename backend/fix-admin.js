const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const fixAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@forgeindiaconnect.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Forgeindia@09';

        console.log(`Ensuring admin user: ${adminEmail}`);

        // Find existing user or create new one
        let user = await User.findOne({ email: adminEmail });

        if (user) {
            console.log('Admin user exists. Updating password and role...');
            user.password = adminPassword; // Pre-save hook will hash it
            user.role = 'admin';
            user.status = 'active';
            await user.save();
        } else {
            console.log('Admin user does not exist. Creating...');
            user = await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                status: 'active'
            });
        }

        console.log('SUCCESS: Admin credentials fixed.');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        
        process.exit(0);
    } catch (err) {
        console.error('Fix failed:', err);
        process.exit(1);
    }
};

fixAdmin();
