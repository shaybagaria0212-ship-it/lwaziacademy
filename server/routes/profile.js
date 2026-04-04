const express = require('express');
const { getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/profile — Get own profile
router.get('/', authenticateToken, (req, res) => {
    try {
        const db = getDb();
        const user = db.prepare(
            'SELECT id, email, role, full_name, avatar_url, created_at FROM users WHERE id = ?'
        ).get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role === 'tutor') {
            const profile = db.prepare('SELECT * FROM tutor_profiles WHERE user_id = ?').get(user.id);
            if (profile) {
                profile.subjects = profile.subjects.split(',');
                profile.grade_levels = profile.grade_levels.split(',');
                profile.verified = Boolean(profile.verified);
            }
            user.profile = profile;
        }

        // Get session stats
        const sessionField = user.role === 'student' ? 'student_id' : 'tutor_id';
        const stats = db.prepare(`
            SELECT
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_sessions,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as upcoming_sessions
            FROM sessions WHERE ${sessionField} = ?
        `).get(user.id);

        user.stats = stats;
        res.json({ user });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ error: 'Failed to load profile' });
    }
});

// PUT /api/profile — Update profile
router.put('/', authenticateToken, (req, res) => {
    try {
        const db = getDb();
        const { full_name, subjects, grade_levels, bio, hourly_rate, experience_years, qualification } = req.body;

        // Update user name
        if (full_name) {
            db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(full_name, req.user.id);
        }

        // Update tutor profile
        if (req.user.role === 'tutor') {
            const updates = [];
            const params = [];

            if (subjects) {
                updates.push('subjects = ?');
                params.push(Array.isArray(subjects) ? subjects.join(',') : subjects);
            }
            if (grade_levels) {
                updates.push('grade_levels = ?');
                params.push(Array.isArray(grade_levels) ? grade_levels.join(',') : grade_levels);
            }
            if (bio !== undefined) {
                updates.push('bio = ?');
                params.push(bio);
            }
            if (hourly_rate !== undefined) {
                updates.push('hourly_rate = ?');
                params.push(hourly_rate);
            }
            if (experience_years !== undefined) {
                updates.push('experience_years = ?');
                params.push(experience_years);
            }
            if (qualification !== undefined) {
                updates.push('qualification = ?');
                params.push(qualification);
            }

            if (updates.length > 0) {
                params.push(req.user.id);
                db.prepare(
                    `UPDATE tutor_profiles SET ${updates.join(', ')} WHERE user_id = ?`
                ).run(...params);
            }
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;
