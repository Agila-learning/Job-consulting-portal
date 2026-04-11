const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

console.log('--- STARTING SERVER ---');

dotenv.config();
connectDB();

const fs = require('fs');

const app = express();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Global Static for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow any Vercel origin for this specific frontend deployment
        if (origin.indexOf('vercel.app') !== -1 || origin.indexOf('localhost') !== -1) {
            return callback(null, true);
        }
        
        return callback(null, true); // Fallback: Allow all during troubleshooting
    },
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

// Main Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/referrals', require('./routes/referralRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/kyc', require('./routes/kycRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/scripts', require('./routes/scriptRoutes'));
app.use('/api/incentives', require('./routes/incentiveRoutes'));
app.use('/api/ats', require('./routes/atsRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/performance-logs', require('./routes/performanceLogRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));

const http = require('http');
const socketIo = require('socket.io');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Socket.io Implementation
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('io', io); // Make io accessible in controllers

io.on('connection', (socket) => {
    console.log('New WebSocket Connection: ' + socket.id);

    socket.on('join', (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`User ${userId} joined their private room`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected');
    });
});

server.listen(PORT, () => {
    console.log('Server started on port ' + PORT);
});

process.on('unhandledRejection', (err) => {
    console.log('Error: ' + err.message);
    server.close(() => process.exit(1));
});
