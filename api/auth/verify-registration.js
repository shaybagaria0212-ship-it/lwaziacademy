// POST /api/auth/verify-registration — Vercel Serverless Function
const connectDB = require('../_db');
const { User, VerificationCode } = require('../_models');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        await connectDB();

        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ error: 'Email and code are required.' });
        }

        const verification = await VerificationCode.findOne({
            email: email.toLowerCase(),
            code,
            type: 'register',
            expiresAt: { $gt: new Date() }
        });

        if (!verification) {
            return res.status(400).json({ error: 'Invalid or expired verification code.' });
        }

        await User.updateOne(
            { email: email.toLowerCase() },
            { is_verified: true, two_fa_enabled: true }
        );
        await VerificationCode.deleteMany({ email: email.toLowerCase(), type: 'register' });

        return res.status(200).json({ message: 'Email verified successfully! You can now sign in.' });
    } catch (err) {
        console.error('Verify registration error:', err);
        return res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
};
