const Message = require('../models/Message');
const Referral = require('../models/Referral');

// Send Message (Direct or Referral Context)
exports.sendMessage = async (req, res) => {
    try {
        const { referralId, recipientId, content, attachments, isDirect } = req.body;
        const { id: senderId } = req.user;

        let messageData = { sender: senderId, content, attachments, readBy: [senderId] };

        if (isDirect) {
            // Permission Check: Admin can message anyone. Agents/Employees can only message Admins.
            const recipient = await require('../models/User').findById(recipientId);
            if (!recipient) return res.status(404).json({ success: false, message: 'Recipient not found' });

            const isAuthorized = 
                req.user.role === 'admin' || 
                recipient.role === 'admin';

            if (!isAuthorized) {
                return res.status(403).json({ success: false, message: 'Direct communication restricted to Administrative channels' });
            }

            messageData.receiver = recipientId;
            messageData.isDirect = true;
        } else {
            // Verify if user has access to this referral
            const referral = await Referral.findById(referralId);
            if (!referral) return res.status(404).json({ success: false, message: 'Referral not found' });

            const isAuthorized = 
                req.user.role === 'admin' || 
                referral.assignedEmployee?.toString() === senderId || 
                referral.referrer?.toString() === senderId;

            if (!isAuthorized) return res.status(403).json({ success: false, message: 'Unauthorized for this thread' });
            
            messageData.referral = referralId;
            referral.updatedAt = new Date();
            await referral.save();
        }

        const message = await Message.create(messageData);
        const populatedMessage = await Message.findById(message._id).populate('sender', 'name role');

        // Emit real-time notification
        const io = req.app.get('io');
        if (isDirect) {
            io.to(recipientId.toString()).emit('new_message', populatedMessage);
            io.to(senderId.toString()).emit('new_message', populatedMessage);
        } else {
            // Emit to referral thread participants (Referrer, Assigned, Admin)
            io.emit('new_message', populatedMessage); // Simplification: broadcast or use room
        }

        res.status(200).json({ success: true, data: message });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get Conversation Threads
exports.getThreads = async (req, res) => {
    try {
        const { id: userId } = req.user;

        // 1. Referral-based threads
        let referralQuery = {};
        if (req.user.role !== 'admin') {
            referralQuery = { $or: [{ referrer: userId }, { assignedEmployee: userId }] };
        }
        const referrals = await Referral.find(referralQuery).populate('job', 'jobTitle');

        // 2. Direct message threads
        let directQuery = { 
            $or: [{ sender: userId }, { receiver: userId }],
            isDirect: true
        };

        const directMessages = await Message.find(directQuery)
            .populate('sender receiver', 'name email role')
            .sort('-createdAt');

        // 3. User List for starting new threads
        let availableUsers = [];
        const User = require('../models/User');
        if (req.user.role === 'admin') {
            // Admin can see all active employees, agents, and team leaders
            availableUsers = await User.find({ role: { $in: ['employee', 'agent', 'team_leader'] } }, 'name email role');
        } else {
            // Everyone else only sees Admins
            availableUsers = await User.find({ role: 'admin' }, 'name email role');
        }

        res.status(200).json({ success: true, data: { referrals, directMessages, availableUsers } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get Messages for a Referral
exports.getMessages = async (req, res) => {
    try {
        const { referralId } = req.params;
        const { id: userId } = req.user;

        const messages = await Message.find({ referral: referralId })
            .populate('sender', 'name role')
            .sort({ createdAt: 1 });

        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get Direct Messages
exports.getDirectMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const { id: currentUserId } = req.user;

        const messages = await Message.find({
            isDirect: true,
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        })
        .populate('sender receiver', 'name role')
        .sort({ createdAt: 1 });

        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Mark Messages as Read
exports.markAsRead = async (req, res) => {
    try {
        const { referralId, senderId } = req.params; // Supports both referral thread or direct sender
        const { id: userId } = req.user;

        let query = { readBy: { $ne: userId } };
        if (referralId) query.referral = referralId;
        if (senderId) query.sender = senderId;

        await Message.updateMany(query, { $addToSet: { readBy: userId } });

        res.status(200).json({ success: true, message: 'Clearance confirmed' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
