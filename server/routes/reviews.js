const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews — Submit a review for a completed session
router.post('/', authenticateToken, requireRole('student'), (req, res) => {
    try {
        const { session_id, rating, comment } = req.body;

        if (!session_id || !rating) {
            return res.status(400).json({ error: 'Session ID and rating are required' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const db = getDb();

        // Verify session exists and is completed
        const session = db.prepare(
            'SELECT * FROM sessions WHERE id = ? AND student_id = ?'
        ).get(session_id, req.user.id);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        if (session.status !== 'completed') {
            return res.status(400).json({ error: 'Can only review completed sessions' });
        }

        // Check if already reviewed
        const existing = db.prepare(
            'SELECT id FROM reviews WHERE session_id = ?'
        ).get(session_id);
        if (existing) {
            return res.status(409).json({ error: 'Session already reviewed' });
        }

        // Insert review
        db.prepare(
            'INSERT INTO reviews (session_id, student_id, tutor_id, rating, comment) VALUES (?, ?, ?, ?, ?)'
        ).run(session_id, req.user.id, session.tutor_id, rating, comment || '');

        // Update tutor's average rating
        const stats = db.prepare(
            'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE tutor_id = ?'
        ).get(session.tutor_id);

        db.prepare(
            'UPDATE tutor_profiles SET rating = ?, review_count = ? WHERE user_id = ?'
        ).run(
            Math.round(stats.avg_rating * 10) / 10,
            stats.count,
            session.tutor_id
        );

        res.status(201).json({ message: 'Review submitted successfully' });
    } catch (err) {
        console.error('Review error:', err);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

module.exports = router;
