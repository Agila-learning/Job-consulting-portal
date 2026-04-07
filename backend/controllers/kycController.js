const KYC = require('../models/KYC');
const User = require('../models/User');

// Submit or Update KYC (External Agent)
exports.submitKYC = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication context missing' });
        }

        const { aadhaarNumber, panNumber } = req.body;
        
        let kycData = { ...req.body };
        
        // Handle file uploads
        if (req.files) {
            if (req.files.aadhaarFront) {
                kycData.aadhaarFront = `/uploads/${req.files.aadhaarFront[0].filename}`;
            }
            if (req.files.panCard) {
                kycData.panCard = `/uploads/${req.files.panCard[0].filename}`;
            }
        }
        
        // Aadhaar Validation (12 digits)
        const aadhaarRegex = /^\d{12}$/;
        if (!aadhaarNumber || !aadhaarRegex.test(aadhaarNumber)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid Aadhaar: Must be exactly 12 numeric digits.' 
            });
        }

        // PAN Validation (5 letters, 4 digits, 1 letter)
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panNumber || !panRegex.test(panNumber.toUpperCase())) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid PAN: Must follow standard format (e.g., ABCDE1234F).' 
            });
        }

        kycData = { 
            ...kycData, 
            panNumber: panNumber.toUpperCase(),
            agent: userId, 
            status: 'pending' 
        };

        let kyc = await KYC.findOne({ agent: userId });
        if (kyc) {
            kyc = await KYC.findOneAndUpdate({ agent: userId }, kycData, { new: true, runValidators: true });
        } else {
            kyc = await KYC.create(kycData);
        }

        res.status(200).json({ success: true, data: kyc });
    } catch (err) {
        console.error('KYC submission error details:', err);
        
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: 'Validation failed: ' + messages.join(', ') });
        }

        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Identiy record already exists for this account.' });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Internal server error while saving identity details.',
            details: err.message
        });
    }
};

// Get own KYC status
exports.getOwnKYC = async (req, res) => {
    try {
        const kyc = await KYC.findOne({ agent: req.user.id });
        res.status(200).json({ success: true, data: kyc });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get all KYC applications (Admin only)
exports.getAllKYC = async (req, res) => {
    try {
        const kycs = await KYC.find().populate('agent', 'name email');
        res.status(200).json({ success: true, data: kycs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Update KYC Status (Admin only)
exports.updateKYCStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const kyc = await KYC.findByIdAndUpdate(
            req.params.id, 
            { 
                status, 
                rejectionReason, 
                verifiedBy: req.user.id, 
                verifiedAt: new Date() 
            }, 
            { new: true }
        );

        if (!kyc) return res.status(404).json({ success: false, message: 'KYC not found' });

        // If verified, update user status if necessary (e.g., mark as verified agent)
        if (status === 'verified') {
            await User.findByIdAndUpdate(kyc.agent, { status: 'active' }); // Agent becomes active upon KYC verification
        }

        res.status(200).json({ success: true, data: kyc });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
