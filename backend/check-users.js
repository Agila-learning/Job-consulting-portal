const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'email role status');
        console.log('--- Current Users in DB ---');
        console.log(JSON.stringify(users, null, 2));
        
        const adminEnvEmail = process.env.ADMIN_EMAIL || 'admin@forgeindiaconnect.com';
        const adminExists = users.find(u => u.email === adminEnvEmail);
        
        if (adminExists) {
            console.log(`\nAdmin from .env (${adminEnvEmail}) EXISTS.`);
        } else {
            console.log(`\nAdmin from .env (${adminEnvEmail}) DOES NOT EXIST.`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
};

checkUsers();
