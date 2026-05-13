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
        
        // Master Seed Logic
        if (seed === 'master') {
            const bcrypt = require('bcryptjs');
            const hash = bcrypt.hashSync('password123', 10);
            const allTutors = [
                { email: 'amith.pattar@gmail.com', name: 'Amith Pattar', subjects: 'Mathematics,Physical Sciences', grades: '7,8,9,10,11,12', rate: 325, experience: 5, qualification: 'Bachelor’s Degree in Electrical and Electronics Engineering', bio: 'I focus on making learning interactive, engaging, and easy to follow. My goal is to help learners improve academically while also building independent problem-solving skills and long-term confidence.' },
                { email: 'suhail.malik@gmail.com', name: 'Suhail Gul Malik', subjects: 'Mathematics,English,Economics', grades: '8,9,10', rate: 250, experience: 5, qualification: 'Post Graduation in Economics - Central University of Kashmir', bio: 'I enjoy helping others understand and succeed in their work. I believe that tutoring is not only about teaching information, but also about encouraging confidence, patience, and a positive attitude towards learning.' },
                { email: 'thembelihlemngoma@gmail.com', name: 'Thembelihle Mngoma', subjects: 'isiZulu', grades: '8,9,10,11,12', rate: 300, experience: 5, qualification: 'Online Teaching Certificate', bio: 'I am passionate about isiZulu and want to reach more students who need support in the subject. My approach focuses on conceptual clarity and cultural understanding.' },
                { email: 'tundecourse@gmail.com', name: 'Babatunde Olalekan', subjects: 'English,Mathematics,Other', grades: '8,9,10,11,12', rate: 700, experience: 3, qualification: 'BSc. English', bio: 'My approach focuses on achieving tangible results through personalized mentorship and high-quality resources. Specializing in Religious studies, English, and Mathematics.' },
                { email: 'wael-fouda@hotmail.com', name: 'Wael Hazem Fouda', subjects: 'Information Technology,Computer Applications Technology,Other', grades: '8,9,10,11,12', rate: 370, experience: 5, qualification: 'Bachelor\'s Degree', bio: 'I teach traders to see the market through an institutional lens. Specialized in Technical Analysis, Pine Script, AI/ML for Trading, and Data Science.' },
                { email: 'Mcanthonyigwe@gmail.com', name: 'Mcanthony Igwe', subjects: 'Mathematics,Other', grades: '8,9,10,11,12', rate: 250, experience: 2, qualification: 'BSc computer science Eduvos University', bio: 'I enjoy breaking complex ideas in mathematics and chess into recognizable and digestible patterns. I have a deep understanding of what it takes to make information understandable.' },
                { email: 'soniarao473@gmail.com', name: 'Sonia Rao', subjects: 'Mathematics', grades: '4,5,6,7,8', rate: 555, experience: 9, qualification: 'Masters in Mathematics', bio: 'I try to explain mathematical concepts step by step so students can learn easily. My goal is to develop their interest in math and problem-solving abilities.' }
            ];

            for (const t of allTutors) {
                let user = await User.findOne({ email: t.email.toLowerCase() });
                if (!user) {
                    user = new User({ email: t.email.toLowerCase(), password_hash: hash, role: 'tutor', full_name: t.name, is_verified: true });
                    await user.save();
                }
                
                // Clean up ALL duplicate users with the same email if any
                const otherUsers = await User.find({ email: t.email.toLowerCase(), _id: { $ne: user._id } });
                const otherUserIds = otherUsers.map(u => u._id);
                
                // Clean up ALL duplicate profiles for these users
                await TutorProfile.deleteMany({ user_id: { $in: [user._id, ...otherUserIds] } });
                if (otherUserIds.length > 0) await User.deleteMany({ _id: { $in: otherUserIds } });
                
                const profile = new TutorProfile({
                    user_id: user._id,
                    subjects: t.subjects,
                    grade_levels: t.grades,
                    bio: t.bio,
                    hourly_rate: t.rate,
                    experience_years: t.experience,
                    qualification: t.qualification,
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
