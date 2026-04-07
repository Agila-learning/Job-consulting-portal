const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const resetPasswords = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for password reset...');

        const User = require('./models/User');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Update all existing users to use 'password123' for testing
        const result = await User.updateMany({}, { $set: { password: hashedPassword } });
        
        console.log(`Successfully reset passwords for ${result.modifiedCount} users!`);
        
        // Also ensure Sarah and Alex exist if they were missing (optional, but good for test consistency)
        // For now, just reset existing ones.
        
        process.exit(0);
    } catch (err) {
        console.error('Password reset failed:', err);
        process.exit(1);
    }
};

resetPasswords();
