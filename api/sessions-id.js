// PUT /api/sessions/:id — Vercel Serverless Function
const jwt = require('jsonwebtoken');
const connectDB = require('./_db');
const { Session } = require('./_models');

const JWT_SECRET = process.env.JWT_SECRET || 'lwazi-academy-secret-key-2024';

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

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
        
        // Extract ID from the path. Vercel rewrites will make req.query.id available or we can parse URL
        let id = req.query.id;
        if (!id) {
            const parts = req.url.split('/');
            id = parts[parts.length - 1].split('?')[0]; // Extract ID from something like /api/sessions/123
        }

        const { status } = req.body;
        if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Verify ownership
        if (decoded.role === 'student' && session.student_id.toString() !== decoded.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        if (decoded.role === 'tutor' && session.tutor_id.toString() !== decoded.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        session.status = status;
        await session.save();

        return res.status(200).json({ message: 'Session updated successfully', session });
    } catch (err) {
        console.error('Session update error:', err);
        return res.status(500).json({ error: 'Failed to update session' });
    }
};
