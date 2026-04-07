const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'FIC Workforce Engine API is running...' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/referrals', require('./routes/referralRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/kyc', require('./routes/kycRoutes'));
console.log('✔ KYC Routes Synchronized');
app.use('/api/messages', require('./routes/messageRoutes'));
console.log('✔ Message Threads Synchronized');
app.use('/api/scripts', require('./routes/scriptRoutes'));
console.log('✔ Script Inventory Synchronized');
app.use('/api/incentives', require('./routes/incentiveRoutes'));
console.log('✔ Incentive Ledger Synchronized');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
