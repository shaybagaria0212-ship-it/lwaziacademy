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

// GET /api/applications — List all applications (admin)
router.get('/', (req, res) => {
    try {
        const db = getDb();
        const { status } = req.query;

        let query = 'SELECT * FROM tutor_applications';
        let params = [];

        if (status && ['pending', 'reviewed', 'approved', 'rejected'].includes(status)) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const applications = db.prepare(query).all(...params);

        // Parse comma-separated fields back into arrays
        const parsed = applications.map(app => ({
            ...app,
            subjects: app.subjects ? app.subjects.split(',') : [],
            grade_levels: app.grade_levels ? app.grade_levels.split(',') : []
        }));

        res.json({
            applications: parsed,
            total: parsed.length
        });
    } catch (err) {
        console.error('List applications error:', err);
        res.status(500).json({ error: 'Failed to fetch applications.' });
    }
});

// GET /api/applications/stats — Summary counts
router.get('/stats', (req, res) => {
    try {
        const db = getDb();
        const total = db.prepare('SELECT COUNT(*) as count FROM tutor_applications').get().count;
        const pending = db.prepare("SELECT COUNT(*) as count FROM tutor_applications WHERE status = 'pending'").get().count;
        const approved = db.prepare("SELECT COUNT(*) as count FROM tutor_applications WHERE status = 'approved'").get().count;
        const rejected = db.prepare("SELECT COUNT(*) as count FROM tutor_applications WHERE status = 'rejected'").get().count;
        const reviewed = db.prepare("SELECT COUNT(*) as count FROM tutor_applications WHERE status = 'reviewed'").get().count;

        res.json({ total, pending, approved, rejected, reviewed });
    } catch (err) {
        console.error('Application stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats.' });
    }
});

// PATCH /api/applications/:id — Update application status
router.patch('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['pending', 'reviewed', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be: pending, reviewed, approved, or rejected.' });
        }

        const db = getDb();

        const app = db.prepare('SELECT * FROM tutor_applications WHERE id = ?').get(id);
        if (!app) {
            return res.status(404).json({ error: 'Application not found.' });
        }

        db.prepare('UPDATE tutor_applications SET status = ? WHERE id = ?').run(status, id);

        res.json({
            message: `Application status updated to "${status}".`,
            application: { ...app, status }
        });
    } catch (err) {
        console.error('Update application error:', err);
        res.status(500).json({ error: 'Failed to update application.' });
    }
});

// DELETE /api/applications/:id — Delete an application
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();

        const app = db.prepare('SELECT id FROM tutor_applications WHERE id = ?').get(id);
        if (!app) {
            return res.status(404).json({ error: 'Application not found.' });
        }

        db.prepare('DELETE FROM tutor_applications WHERE id = ?').run(id);
        res.json({ message: 'Application deleted.' });
    } catch (err) {
        console.error('Delete application error:', err);
        res.status(500).json({ error: 'Failed to delete application.' });
    }
});

module.exports = router;
