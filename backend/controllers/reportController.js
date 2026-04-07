const Referral = require('../models/Referral');
const ManualIncentive = require('../models/ManualIncentive');

// Get all audit records (Referrals + Manual Grants)
// Route: GET /api/reports
exports.getAuditRecords = async (req, res) => {
    try {
        const [referrals, grants] = await Promise.all([
            Referral.find({ status: 'Joined' })
                .populate('referrer', 'name role')
                .populate('job', 'jobTitle companyName')
                .sort('-updatedAt'),
            ManualIncentive.find()
                .populate('recipient', 'name role')
                .populate('createdBy', 'name')
                .sort('-createdAt')
        ]);

        // Format referrals into audit format
        const referralReports = referrals.map(ref => ({
            _id: ref._id,
            entryType: 'referral',
            id: `REF-${ref._id.toString().slice(-6).toUpperCase()}`,
            title: `${ref.candidateName} - ${ref.job?.jobTitle || 'N/A'}`,
            type: 'Commission',
            date: new Date(ref.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            size: '0.4 MB',
            author: ref.referrer?.name || 'System',
            amount: ref.calculatedCommission || '0',
            status: ref.payoutStatus,
            metadata: {
                company: ref.job?.companyName,
                source: ref.sourceType
            }
        }));

        // Format grants into audit format
        const grantReports = grants.map(grant => ({
            _id: grant._id,
            entryType: 'manual',
            id: `GRT-${grant._id.toString().slice(-6).toUpperCase()}`,
            title: grant.reason || 'Manual Incentive Grant',
            type: 'Incentive',
            date: new Date(grant.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            size: '0.2 MB',
            author: grant.createdBy?.name || 'Admin',
            amount: grant.amount,
            status: 'Approved',
            metadata: {
                recipient: grant.recipient?.name || 'Team Grant',
                type: grant.type
            }
        }));

        const allReports = [...referralReports, ...grantReports].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({ 
            success: true, 
            count: allReports.length, 
            data: allReports 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Placeholder for generating a PDF/CSV file on the server if needed
exports.generateSnapshot = async (req, res) => {
    try {
        // Logic to generate a physical file
        res.status(200).json({ success: true, message: 'Snapshot generation initiated' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
