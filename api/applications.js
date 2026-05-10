// POST /api/applications — Vercel Serverless Function
const connectDB = require('./_db');
const { TutorApplication } = require('./_models');
const { sendApplicationNotification } = require('./_email');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        await connectDB();

        if (req.method === 'POST') {
            const {
                full_name, email, phone,
                subjects, grade_levels,
                qualification, experience_years,
                hourly_rate, motivation
            } = req.body;

            // Validation
            if (!full_name || !email || !subjects || !grade_levels || !qualification) {
                return res.status(400).json({ error: 'All primary fields are required.' });
            }

            // Check for existing pending application
            const existing = await TutorApplication.findOne({ email, status: 'pending' });
            if (existing) {
                return res.status(409).json({ error: 'You already have a pending application.' });
            }

            // Save to MongoDB
            const application = new TutorApplication({
                full_name, email, phone,
                subjects: Array.isArray(subjects) ? subjects.join(',') : subjects,
                grade_levels: Array.isArray(grade_levels) ? grade_levels.join(',') : grade_levels,
                qualification,
                experience_years: Number(experience_years) || 0,
                hourly_rate: Number(hourly_rate) || 0,
                motivation
            });

            await application.save();

            // Send Email Notification to Admin (Shay)
            try {
                const adminEmail = process.env.EMAIL_USER; // Defaulting to the sender email
                await sendApplicationNotification(adminEmail, {
                    full_name, email, phone, 
                    subjects: Array.isArray(subjects) ? subjects.join(', ') : subjects,
                    grade_levels: Array.isArray(grade_levels) ? grade_levels.join(', ') : grade_levels,
                    qualification, experience_years, hourly_rate, motivation
                });
            } catch (emailErr) {
                console.error('Failed to send application email:', emailErr);
                // We don't fail the request if email fails, but it's logged
            }

            return res.status(201).json({
                message: 'Your application has been submitted successfully! We will get back to you shortly.',
                id: application._id
            });
        } 
        
        if (req.method === 'GET') {
            // Simple listing for admin (could add auth later)
            const applications = await TutorApplication.find().sort({ created_at: -1 }).lean();
            return res.status(200).json({ applications, count: applications.length });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Applications error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
