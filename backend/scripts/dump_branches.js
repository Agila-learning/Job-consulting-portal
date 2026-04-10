const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Branch = require('../models/Branch');

const dump = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const branches = await Branch.find({});
        console.log('--- BRANCH DATA ---');
        console.log(JSON.stringify(branches, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

dump();
