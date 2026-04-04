const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/sessions — Book a session (students only)
router.post('/', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const { tutor_id, subject, scheduled_at, duration_minutes, notes } = req.body;

        if (!tutor_id || !subject || !scheduled_at) {
            return res.status(400).json({ error: 'Tutor, subject, and scheduled time are required' });
        }

        const db = getDb();

        // Verify tutor exists
        const tutor = db.prepare('SELECT id FROM users WHERE id = ? AND role = ?').get(tutor_id, 'tutor');
        if (!tutor) {
            return res.status(404).json({ error: 'Tutor not found' });
        }

        // Prevent booking yourself
        if (req.user.id === tutor_id) {
            return res.status(400).json({ error: 'You cannot book yourself' });
        }

        const result = db.prepare(
            `INSERT INTO sessions (student_id, tutor_id, subject, scheduled_at, duration_minutes, notes)
             VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
            req.user.id,
            tutor_id,
            subject,
            scheduled_at,
            duration_minutes || 60,
            notes || ''
        );

        res.status(201).json({
            message: 'Session booked successfully',
            session: { id: result.lastInsertRowid }
        });
    } catch (err) {
        console.error('Session booking error:', err);
        res.status(500).json({ error: 'Failed to book session' });
    }
});

// GET /api/sessions — Get user's sessions
router.get('/', authenticateToken, (req, res) => {
    try {
        const db = getDb();
        const { status } = req.query;

        let query;
        const params = [];

        if (req.user.role === 'student') {
            query = `
                SELECT s.*, u.full_name as tutor_name, u.email as tutor_email,
                       tp.subjects as tutor_subjects, tp.hourly_rate
                FROM sessions s
                JOIN users u ON s.tutor_id = u.id
                JOIN tutor_profiles tp ON s.tutor_id = tp.user_id
                WHERE s.student_id = ?
            `;
            params.push(req.user.id);
        } else {
            query = `
                SELECT s.*, u.full_name as student_name, u.email as student_email
                FROM sessions s
                JOIN users u ON s.student_id = u.id
                WHERE s.tutor_id = ?
            `;
            params.push(req.user.id);
        }

        if (status) {
            query += ` AND s.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY s.scheduled_at DESC`;

        const sessions = db.prepare(query).all(...params);
        res.json({ sessions });
    } catch (err) {
        console.error('Session list error:', err);
        res.status(500).json({ error: 'Failed to load sessions' });
    }
});

// PUT /api/sessions/:id — Update session status
router.put('/:id', authenticateToken, (req, res) => {
    try {
        const db = getDb();
        const sessionId = req.params.id;
        const { status } = req.body;

        if (!status || !['confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Valid status required (confirmed, cancelled, completed)' });
        }

        const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Only tutor can confirm/complete, both can cancel
        if (status === 'confirmed' || status === 'completed') {
            if (req.user.id !== session.tutor_id) {
                return res.status(403).json({ error: 'Only the tutor can confirm or complete sessions' });
            }
        }
        if (status === 'cancelled') {
            if (req.user.id !== session.student_id && req.user.id !== session.tutor_id) {
                return res.status(403).json({ error: 'You are not part of this session' });
            }
        }

        db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run(status, sessionId);

        res.json({ message: `Session ${status} successfully` });
    } catch (err) {
        console.error('Session update error:', err);
        res.status(500).json({ error: 'Failed to update session' });
    }
});

module.exports = router;
