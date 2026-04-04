const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
    try {
        const { email, password, full_name, role, subjects, grade_levels, bio, hourly_rate, experience_years, qualification } = req.body;

        // Validation
        if (!email || !password || !full_name || !role) {
            return res.status(400).json({ error: 'Email, password, full name, and role are required' });
        }
        if (!['student', 'tutor'].includes(role)) {
            return res.status(400).json({ error: 'Role must be "student" or "tutor"' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const db = getDb();

        // Check existing user
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        // Hash password
        const password_hash = bcrypt.hashSync(password, 10);

        // Insert user
        const result = db.prepare(
            'INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)'
        ).run(email, password_hash, role, full_name);

        const userId = result.lastInsertRowid;

        // If tutor, create profile
        if (role === 'tutor') {
            if (!subjects || !grade_levels) {
                return res.status(400).json({ error: 'Tutors must specify subjects and grade levels' });
            }
            db.prepare(
                `INSERT INTO tutor_profiles (user_id, subjects, grade_levels, bio, hourly_rate, experience_years, qualification)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`
            ).run(
                userId,
                Array.isArray(subjects) ? subjects.join(',') : subjects,
                Array.isArray(grade_levels) ? grade_levels.join(',') : grade_levels,
                bio || '',
                hourly_rate || 0,
                experience_years || 0,
                qualification || ''
            );
        }

        // Generate token
        const token = jwt.sign(
            { id: userId, email, role, full_name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: { id: userId, email, role, full_name }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const validPassword = bcrypt.compareSync(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                full_name: user.full_name
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
    try {
        const db = getDb();
        const user = db.prepare('SELECT id, email, role, full_name, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If tutor, include profile
        if (user.role === 'tutor') {
            const profile = db.prepare('SELECT * FROM tutor_profiles WHERE user_id = ?').get(user.id);
            user.profile = profile;
        }

        res.json({ user });
    } catch (err) {
        console.error('Auth check error:', err);
        res.status(500).json({ error: 'Failed to verify authentication' });
    }
});

module.exports = router;
