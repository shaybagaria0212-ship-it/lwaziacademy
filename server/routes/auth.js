const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const VerificationCode = require('../models/VerificationCode');
const { sendVerificationEmail, send2FAEmail } = require('../services/emailService');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, role, subjects, grade_levels, bio, hourly_rate, experience_years, qualification } = req.body;

        if (!email || !password || !full_name || !role) {
            return res.status(400).json({ error: 'Email, password, full name, and role are required' });
        }
        if (!['student', 'tutor'].includes(role)) {
            return res.status(400).json({ error: 'Role must be "student" or "tutor"' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        
        const user = new User({
            email,
            password_hash,
            role,
            full_name
        });
        await user.save();

        if (role === 'tutor') {
            const tutorProfile = new TutorProfile({
                user_id: user._id,
                subjects: Array.isArray(subjects) ? subjects.join(',') : subjects || '',
                grade_levels: Array.isArray(grade_levels) ? grade_levels.join(',') : grade_levels || '',
                bio,
                hourly_rate,
                experience_years,
                qualification
            });
            await tutorProfile.save();
        }

        // Send Verification Code
        const code = generateCode();
        await VerificationCode.create({
            email,
            code,
            type: 'register',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        await sendVerificationEmail(email, code);

        res.status(201).json({
            message: 'Registration successful! Please check your email for the verification code.',
            email
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// POST /api/auth/verify-registration
router.post('/verify-registration', async (req, res) => {
    try {
        const { email, code } = req.body;
        const verification = await VerificationCode.findOne({ email, code, type: 'register', expiresAt: { $gt: new Date() } });
        
        if (!verification) {
            return res.status(400).json({ error: 'Invalid or expired verification code.' });
        }

        await User.updateOne({ email }, { is_verified: true, two_fa_enabled: true });
        await VerificationCode.deleteOne({ _id: verification._id });

        res.json({ message: 'Email verified successfully! You can now log in.' });
    } catch (err) {
        res.status(500).json({ error: 'Verification failed.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.is_verified) {
            return res.status(403).json({ error: 'Please verify your email first.', requires_verification: true });
        }

        if (user.two_fa_enabled) {
            const code = generateCode();
            await VerificationCode.create({
                email,
                code,
                type: '2fa',
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            });
            await send2FAEmail(email, code);
            
            return res.json({ message: '2FA code sent to email', requires_2fa: true, email });
        }

        // Generate token and session if 2FA disabled
        req.session.userId = user._id;
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Login successful', token, user: { id: user._id, email: user.email, role: user.role, full_name: user.full_name } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// POST /api/auth/verify-login
router.post('/verify-login', async (req, res) => {
    try {
        const { email, code } = req.body;
        const verification = await VerificationCode.findOne({ email, code, type: '2fa', expiresAt: { $gt: new Date() } });
        
        if (!verification) {
            return res.status(400).json({ error: 'Invalid or expired 2FA code.' });
        }

        const user = await User.findOne({ email });
        await VerificationCode.deleteOne({ _id: verification._id });

        req.session.userId = user._id;
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ message: 'Login successful', token, user: { id: user._id, email: user.email, role: user.role, full_name: user.full_name } });
    } catch (err) {
        res.status(500).json({ error: 'Login verification failed.' });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password_hash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let userObj = user.toObject();
        if (user.role === 'tutor') {
            const profile = await TutorProfile.findOne({ user_id: user._id });
            userObj.profile = profile;
        }

        res.json({ user: userObj });
    } catch (err) {
        console.error('Auth check error:', err);
        res.status(500).json({ error: 'Failed to verify authentication' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;
