const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('./_db');
const { User, VerificationCode, TutorProfile } = require('./_models');
const { sendVerificationEmail, send2FAEmail } = require('./_email');

const JWT_SECRET = process.env.JWT_SECRET || 'lwazi-academy-secret-key-2024';
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.split('/').pop();

    try {
        await connectDB();

        if (path === 'login' && req.method === 'POST') {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
            const user = await User.findOne({ email: email.toLowerCase() });
            if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });
            if (!user.is_verified) return res.status(403).json({ error: 'Please verify your email first.', requires_verification: true });
            
            if (user.two_fa_enabled) {
                const code = generateCode();
                await VerificationCode.deleteMany({ email: email.toLowerCase(), type: '2fa' });
                await VerificationCode.create({ email: email.toLowerCase(), code, type: '2fa', expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
                await send2FAEmail(email, code);
                return res.status(200).json({ message: 'Verification code sent.', requires_2fa: true, email: email.toLowerCase() });
            }
            const token = jwt.sign({ id: user._id, email: user.email, role: user.role, full_name: user.full_name }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(200).json({ message: 'Login successful', token, user: { id: user._id, email: user.email, role: user.role, full_name: user.full_name } });
        }

        if (path === 'register' && req.method === 'POST') {
            const { full_name, email, password, role } = req.body;
            if (!full_name || !email || !password || !role) return res.status(400).json({ error: 'All fields are required.' });
            const existing = await User.findOne({ email: email.toLowerCase() });
            if (existing) return res.status(400).json({ error: 'Email already in use.' });
            const password_hash = await bcrypt.hash(password, 10);
            const user = await User.create({ full_name, email: email.toLowerCase(), password_hash, role, is_verified: false });
            const code = generateCode();
            await VerificationCode.create({ email: email.toLowerCase(), code, type: 'register', expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
            await sendVerificationEmail(email, code);
            return res.status(201).json({ message: 'Registration successful. Verification code sent.', email: email.toLowerCase() });
        }

        if (path === 'verify-registration' && req.method === 'POST') {
            const { email, code } = req.body;
            const record = await VerificationCode.findOne({ email: email.toLowerCase(), code, type: 'register' });
            if (!record) return res.status(400).json({ error: 'Invalid or expired code.' });
            await User.findOneAndUpdate({ email: email.toLowerCase() }, { is_verified: true });
            await VerificationCode.deleteOne({ _id: record._id });
            return res.status(200).json({ success: true, message: 'Email verified successfully.' });
        }

        if (path === 'verify-login' && req.method === 'POST') {
            const { email, code } = req.body;
            const record = await VerificationCode.findOne({ email: email.toLowerCase(), code, type: '2fa' });
            if (!record) return res.status(400).json({ error: 'Invalid or expired code.' });
            const user = await User.findOne({ email: email.toLowerCase() });
            const token = jwt.sign({ id: user._id, email: user.email, role: user.role, full_name: user.full_name }, JWT_SECRET, { expiresIn: '7d' });
            await VerificationCode.deleteOne({ _id: record._id });
            return res.status(200).json({ success: true, token, user: { id: user._id, email: user.email, role: user.role, full_name: user.full_name } });
        }

        if (path === 'me' && req.method === 'GET') {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: 'No token provided' });
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password_hash').lean();
            if (!user) return res.status(404).json({ error: 'User not found' });
            return res.status(200).json({ user });
        }

        return res.status(404).json({ error: 'Auth action not found' });
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
