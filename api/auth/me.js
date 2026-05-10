// GET /api/auth/me — Vercel Serverless Function
const jwt = require('jsonwebtoken');
const connectDB = require('../_db');
const { User, TutorProfile } = require('../_models');

const JWT_SECRET = process.env.JWT_SECRET || 'lwazi-academy-secret-key-2024';

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        await connectDB();

        const user = await User.findById(decoded.id).select('-password_hash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let userObj = user.toObject();
        if (user.role === 'tutor') {
            const profile = await TutorProfile.findOne({ user_id: user._id });
            userObj.profile = profile;
        }

        return res.status(200).json({ user: userObj });
    } catch (err) {
        console.error('Auth me error:', err);
        return res.status(500).json({ error: 'Failed to verify authentication' });
    }
};
