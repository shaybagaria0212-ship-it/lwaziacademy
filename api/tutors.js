// GET /api/tutors — Vercel Serverless Function
const connectDB = require('./_db');
const { User, TutorProfile } = require('./_models');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        await connectDB();

        const { subject, search, sort, seed } = req.query;
        
        // Temporary seed logic for Mcanthony Igwe
        if (seed === 'mcanthony') {
            const bcrypt = require('bcryptjs');
            const hash = bcrypt.hashSync('password123', 10);
            const tutorData = {
                email: 'Mcanthonyigwe@gmail.com',
                name: 'Mcanthony Igwe',
                subjects: 'Mathematics,Other',
                grades: '8,9,10,11,12',
                bio: 'I am a tutor because I enjoy breaking complex ideas in mathematics and chess into recognizable and digestible patterns that any student can follow. I\'ve worked with students of many different levels throughout my teaching journey, and I have developed a deep understanding of what it takes to make information understandable and manageable.',
                rate: 250,
                experience: 2,
                qualification: 'BSc computer science Eduvos University'
            };

            let user = await User.findOne({ email: tutorData.email });
            if (!user) {
                user = new User({ email: tutorData.email, password_hash: hash, role: 'tutor', full_name: tutorData.name, is_verified: true });
                await user.save();
            }
            let profile = await TutorProfile.findOne({ user_id: user._id });
            if (!profile) {
                profile = new TutorProfile({
                    user_id: user._id,
                    subjects: tutorData.subjects,
                    grade_levels: tutorData.grades,
                    bio: tutorData.bio,
                    hourly_rate: tutorData.rate,
                    experience_years: tutorData.experience,
                    qualification: tutorData.qualification,
                    rating: 5.0,
                    verified: 1
                });
                await profile.save();
            }
        }

        // Get all tutor profiles with user info
        const profiles = await TutorProfile.find().populate('user_id', 'full_name email avatar_url').lean();

        let tutors = profiles.map(p => ({
            id: p.user_id?._id || p._id,
            full_name: p.user_id?.full_name || 'Unknown',
            email: p.user_id?.email || '',
            avatar_url: p.user_id?.avatar_url || null,
            subjects: p.subjects ? p.subjects.split(',') : [],
            grade_levels: p.grade_levels ? p.grade_levels.split(',') : [],
            bio: p.bio || '',
            hourly_rate: Math.round((p.hourly_rate || 0) * 1.2),
            experience_years: p.experience_years || 0,
            qualification: p.qualification || '',
            rating: p.rating || 0,
            review_count: p.review_count || 0,
            verified: Boolean(p.verified)
        }));
        
        // Deduplicate tutors by full_name and email
        const seen = new Set();
        tutors = tutors.filter(t => {
            const key = `${t.full_name}-${t.email}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Filter by subject
        if (subject) {
            tutors = tutors.filter(t => t.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase())));
        }

        // Search
        if (search) {
            const s = search.toLowerCase();
            tutors = tutors.filter(t =>
                t.full_name.toLowerCase().includes(s) ||
                t.bio.toLowerCase().includes(s) ||
                t.subjects.some(sub => sub.toLowerCase().includes(s))
            );
        }

        // Sort
        if (sort === 'price_low') tutors.sort((a, b) => a.hourly_rate - b.hourly_rate);
        else if (sort === 'price_high') tutors.sort((a, b) => b.hourly_rate - a.hourly_rate);
        else if (sort === 'experience') tutors.sort((a, b) => b.experience_years - a.experience_years);
        else tutors.sort((a, b) => b.rating - a.rating || b.review_count - a.review_count);

        return res.status(200).json({ tutors, count: tutors.length });
    } catch (err) {
        console.error('Tutors error:', err);
        return res.status(500).json({ error: 'Failed to load tutors' });
    }
};
