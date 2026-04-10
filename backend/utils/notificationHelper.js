const Notification = require('../models/Notification');

/**
 * Standard utility to send persistent DB notifications and real-time Socket alerts.
 * @param {Object} app - Express app instance to get 'io'
 * @param {Object} params - { userId, title, message, type, link }
 */
const sendNotification = async (app, { userId, title, message, type = 'info', link = '' }) => {
    try {
        if (!userId) return;

        // 1. Persist to Database
        await Notification.create({
            user: userId,
            title,
            message,
            type,
            link
        });

        // 2. Emit Real-time via Socket.io
        const io = app.get('io');
        if (io) {
            io.to(userId.toString()).emit('newNotification', {
                title,
                message,
                type,
                createdAt: new Date()
            });
        }
    } catch (err) {
        console.error('Notification Dispatch Failure:', err);
    }
};

module.exports = { sendNotification };
