// GET & POST /api/sessions — Vercel Serverless Function
const jwt = require('jsonwebtoken');
const connectDB = require('./_db');
const { Session, User } = require('./_models');

const JWT_SECRET = process.env.JWT_SECRET || 'lwazi-academy-secret-key-2024';

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

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

        // --- Handle GET ---
        if (req.method === 'GET') {
            const { status } = req.query;

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
        }

        // --- Handle POST (Booking) ---
        if (req.method === 'POST') {
            if (decoded.role !== 'student') {
                return res.status(403).json({ error: 'Only students can book sessions' });
            }

            const { tutor_id, subject, scheduled_at, duration_minutes, notes } = req.body;

            if (!tutor_id || !subject || !scheduled_at) {
                return res.status(400).json({ error: 'Tutor, subject, and scheduled time are required' });
            }

            // Verify tutor exists and is actually a tutor
            const tutor = await User.findOne({ _id: tutor_id, role: 'tutor' });
            if (!tutor) {
                return res.status(404).json({ error: 'Tutor not found' });
            }

            // Prevent booking yourself
            if (decoded.id === tutor_id) {
                return res.status(400).json({ error: 'You cannot book yourself' });
            }

            const session = new Session({
                student_id: decoded.id,
                tutor_id,
                subject,
                scheduled_at: new Date(scheduled_at),
                duration_minutes: duration_minutes || 60,
                notes: notes || '',
                status: 'pending'
            });

            await session.save();

            return res.status(201).json({
                message: 'Session booked successfully',
                session: { id: session._id }
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Sessions error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
