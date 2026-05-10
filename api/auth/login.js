// POST /api/auth/login — Vercel Serverless Function
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('../_db');
const { User, VerificationCode } = require('../_models');
const { send2FAEmail } = require('../_email');

const JWT_SECRET = process.env.JWT_SECRET || 'lwazi-academy-secret-key-2024';
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        await connectDB();

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        if (!user.is_verified) {
            return res.status(403).json({
                error: 'Please verify your email first. Check your inbox for the verification code.',
                requires_verification: true
            });
        }

        // 2FA: send code
        if (user.two_fa_enabled) {
            const code = generateCode();
            await VerificationCode.deleteMany({ email: email.toLowerCase(), type: '2fa' });
            await VerificationCode.create({
                email: email.toLowerCase(),
                code,
                type: '2fa',
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            });
            await send2FAEmail(email, code);

            return res.status(200).json({
                message: 'A verification code has been sent to your email.',
                requires_2fa: true,
                email: email.toLowerCase()
            });
        }

        // No 2FA — issue token directly
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
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Login failed. Please try again.' });
    }
};
