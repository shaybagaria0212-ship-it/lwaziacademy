// GET /api/sessions — Vercel Serverless Function
const jwt = require('jsonwebtoken');
const connectDB = require('./_db');
const { Session, User } = require('./_models');

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
        if (!token) return res.status(401).json({ error: 'Authentication required' });

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        await connectDB();
        const { status } = req.query;

        // Build query
        const query = {};
        if (decoded.role === 'student') query.student_id = decoded.id;
        else query.tutor_id = decoded.id;

        if (status) query.status = status;

        const sessions = await Session.find(query)
            .populate('student_id', 'full_name email avatar_url')
            .populate('tutor_id', 'full_name email avatar_url')
            .sort({ scheduled_at: -1 })
            .lean();

        const formatted = sessions.map(s => ({
            id: s._id,
            student_name: s.student_id?.full_name || 'Unknown Student',
            student_email: s.student_id?.email || '',
            tutor_name: s.tutor_id?.full_name || 'Unknown Tutor',
            tutor_email: s.tutor_id?.email || '',
            subject: s.subject,
            scheduled_at: s.scheduled_at,
            duration_minutes: s.duration_minutes,
            status: s.status,
            notes: s.notes
        }));

        return res.status(200).json({ sessions: formatted });
    } catch (err) {
        console.error('Sessions error:', err);
        return res.status(500).json({ error: 'Failed to load sessions' });
    }
};
