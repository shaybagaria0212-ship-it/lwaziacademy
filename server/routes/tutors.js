const express = require('express');
const { getDb } = require('../db/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/tutors — List all tutors with optional filtering
router.get('/', optionalAuth, (req, res) => {
    try {
        const db = getDb();
        const { subject, grade, min_rate, max_rate, search, sort } = req.query;

        let query = `
            SELECT u.id, u.full_name, u.email, u.avatar_url,
                   tp.subjects, tp.grade_levels, tp.bio, tp.hourly_rate,
                   tp.experience_years, tp.qualification, tp.rating,
                   tp.review_count, tp.verified
            FROM users u
            JOIN tutor_profiles tp ON u.id = tp.user_id
            WHERE u.role = 'tutor'
        `;
        const params = [];

        // Filter by subject
        if (subject) {
            query += ` AND tp.subjects LIKE ?`;
            params.push(`%${subject}%`);
        }

        // Filter by grade level
        if (grade) {
            query += ` AND tp.grade_levels LIKE ?`;
            params.push(`%${grade}%`);
        }

        // Filter by rate range
        if (min_rate) {
            query += ` AND tp.hourly_rate >= ?`;
            params.push(Number(min_rate));
        }
        if (max_rate) {
            query += ` AND tp.hourly_rate <= ?`;
            params.push(Number(max_rate));
        }

        // Search by name or bio
        if (search) {
            query += ` AND (u.full_name LIKE ? OR tp.bio LIKE ? OR tp.subjects LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Sort
        switch (sort) {
            case 'price_low':
                query += ` ORDER BY tp.hourly_rate ASC`;
                break;
            case 'price_high':
                query += ` ORDER BY tp.hourly_rate DESC`;
                break;
            case 'experience':
                query += ` ORDER BY tp.experience_years DESC`;
                break;
            case 'rating':
            default:
                query += ` ORDER BY tp.rating DESC, tp.review_count DESC`;
                break;
        }

        const tutors = db.prepare(query).all(...params);

        // Parse subjects and grade_levels into arrays
        const formatted = tutors.map(t => ({
            ...t,
            subjects: t.subjects.split(','),
            grade_levels: t.grade_levels.split(','),
            verified: Boolean(t.verified)
        }));

        res.json({ tutors: formatted, count: formatted.length });
    } catch (err) {
        console.error('Tutor list error:', err);
        res.status(500).json({ error: 'Failed to load tutors' });
    }
});

// GET /api/tutors/:id — Get a single tutor with reviews
router.get('/:id', optionalAuth, (req, res) => {
    try {
        const db = getDb();
        const tutorId = req.params.id;

        const tutor = db.prepare(`
            SELECT u.id, u.full_name, u.email, u.avatar_url, u.created_at,
                   tp.subjects, tp.grade_levels, tp.bio, tp.hourly_rate,
                   tp.experience_years, tp.qualification, tp.availability,
                   tp.rating, tp.review_count, tp.verified
            FROM users u
            JOIN tutor_profiles tp ON u.id = tp.user_id
            WHERE u.id = ? AND u.role = 'tutor'
        `).get(tutorId);

        if (!tutor) {
            return res.status(404).json({ error: 'Tutor not found' });
        }

        // Get reviews
        const reviews = db.prepare(`
            SELECT r.*, u.full_name as student_name
            FROM reviews r
            JOIN users u ON r.student_id = u.id
            WHERE r.tutor_id = ?
            ORDER BY r.created_at DESC
            LIMIT 10
        `).all(tutorId);

        res.json({
            tutor: {
                ...tutor,
                subjects: tutor.subjects.split(','),
                grade_levels: tutor.grade_levels.split(','),
                verified: Boolean(tutor.verified)
            },
            reviews
        });
    } catch (err) {
        console.error('Tutor detail error:', err);
        res.status(500).json({ error: 'Failed to load tutor details' });
    }
});

module.exports = router;
