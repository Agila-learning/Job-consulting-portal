require('dotenv').config();
const mongoose = require('mongoose');
const Branch = require('./models/Branch');

const addThirupattur = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        const branches = ['Bangalore', 'Chennai', 'Krishnagiri', 'Thirupattur'];
        
        for (const name of branches) {
            const exists = await Branch.findOne({ name });
            if (!exists) {
                await Branch.create({
                    name,
                    location: name === 'Thirupattur' ? 'Thirupattur, Tamil Nadu' : name,
                    status: 'active'
                });
                console.log(`Created branch: ${name}`);
            } else {
                console.log(`Branch exists: ${name}`);
            }
        }

        console.log('Branch synchronization complete!');
        process.exit();
    } catch (err) {
        console.error('Failed to sync branches:', err);
        process.exit(1);
    }
};

addThirupattur();
