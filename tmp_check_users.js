const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String
});

const User = mongoose.model('User', UserSchema);

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- USER DIRECTORY ---');
        const users = await User.find({}, 'name email role');
        users.forEach(u => {
            console.log(`- [${u.role.toUpperCase()}] ${u.name}: ${u.email}`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error fetching users:', err);
    }
}

listUsers();
