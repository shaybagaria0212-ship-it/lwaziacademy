const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

// POST /api/applications — Submit a tutor application
router.post('/', (req, res) => {
    try {
        const {
            full_name, email, phone,
            subjects, grade_levels,
            qualification, experience_years,
            hourly_rate, motivation
        } = req.body;

        // Validation
        if (!full_name || !email || !subjects || !grade_levels || !qualification) {
            return res.status(400).json({
                error: 'Full name, email, subjects, grade levels, and qualification are required.'
            });
        }

        if (!Array.isArray(subjects) || subjects.length === 0) {
            return res.status(400).json({ error: 'Please select at least one subject.' });
        }

        if (!Array.isArray(grade_levels) || grade_levels.length === 0) {
            return res.status(400).json({ error: 'Please select at least one grade level.' });
        }

        // Simple email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please enter a valid email address.' });
        }

        const db = getDb();

        // Check for existing pending application from same email
        const existing = db.prepare(
            "SELECT id FROM tutor_applications WHERE email = ? AND status = 'pending'"
        ).get(email);

        if (existing) {
            return res.status(409).json({
                error: 'You already have a pending application. We will be in touch soon!'
            });
        }

        // Insert application
        const result = db.prepare(
            `INSERT INTO tutor_applications
             (full_name, email, phone, subjects, grade_levels, qualification, experience_years, hourly_rate, motivation)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
            full_name,
            email,
            phone || '',
            subjects.join(','),
            grade_levels.join(','),
            qualification,
            experience_years || 0,
            hourly_rate || 0,
            motivation || ''
        );

        res.status(201).json({
            message: 'Your application has been submitted successfully! We will review it and get back to you shortly.',
            applicationId: result.lastInsertRowid
        });
    } catch (err) {
        console.error('Application submission error:', err);
        res.status(500).json({ error: 'Failed to submit application. Please try again.' });
    }
});

module.exports = router;
