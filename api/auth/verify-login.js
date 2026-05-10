// POST /api/auth/verify-login — Vercel Serverless Function
const jwt = require('jsonwebtoken');
const connectDB = require('../_db');
const { User, VerificationCode } = require('../_models');

const JWT_SECRET = process.env.JWT_SECRET || 'lwazi-academy-secret-key-2024';

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
            type: '2fa',
            expiresAt: { $gt: new Date() }
        });

        if (!verification) {
            return res.status(400).json({ error: 'Invalid or expired verification code.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        await VerificationCode.deleteMany({ email: email.toLowerCase(), type: '2fa' });

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, full_name: user.full_name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user._id, email: user.email, role: user.role, full_name: user.full_name }
        });
    } catch (err) {
        console.error('Verify login error:', err);
        return res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
};
