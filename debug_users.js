const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Root level script
dotenv.config({ path: './backend/.env' });

const UserSchema = new mongoose.Schema({
    email: String,
    role: String,
    status: String,
    branchId: mongoose.Schema.Types.ObjectId
});

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = mongoose.model('User', UserSchema);
        const users = await User.find({}, 'email role status branchId');
        console.log('--- USER LIST ---');
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
