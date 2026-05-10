// POST /api/auth/register — Vercel Serverless Function
const bcrypt = require('bcryptjs');
const connectDB = require('../_db');
const { User, TutorProfile, VerificationCode } = require('../_models');
const { sendVerificationEmail } = require('../_email');

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        await connectDB();

        const { email, password, full_name, role, subjects, grade_levels, bio, hourly_rate, experience_years, qualification } = req.body;

        if (!email || !password || !full_name || !role) {
            return res.status(400).json({ error: 'Email, password, full name, and role are required.' });
        }
        if (!['student', 'tutor'].includes(role)) {
            return res.status(400).json({ error: 'Role must be "student" or "tutor".' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const user = await User.create({
            email: email.toLowerCase(),
            password_hash,
            role,
            full_name
        });

        if (role === 'tutor') {
            await TutorProfile.create({
                user_id: user._id,
                subjects: Array.isArray(subjects) ? subjects.join(',') : subjects || '',
                grade_levels: Array.isArray(grade_levels) ? grade_levels.join(',') : grade_levels || '',
                bio: bio || '',
                hourly_rate: hourly_rate || 0,
                experience_years: experience_years || 0,
                qualification: qualification || ''
            });
        }

        // Generate and send verification code
        const code = generateCode();
        await VerificationCode.deleteMany({ email: email.toLowerCase(), type: 'register' });
        await VerificationCode.create({
            email: email.toLowerCase(),
            code,
            type: 'register',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        await sendVerificationEmail(email, code);

        return res.status(201).json({
            message: 'Registration successful! Check your email for the verification code.',
            email: email.toLowerCase()
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
};
