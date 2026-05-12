const connectDB = require('./_db');
const { User, TutorProfile } = require('./_models');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectDB();
        const hash = bcrypt.hashSync('password123', 10);

        const newTutors = [
            {
                email: 'thembelihlemngoma@gmail.com',
                name: 'Thembelihle Mngoma',
                subjects: 'isiZulu',
                grades: '8,9,10,11,12',
                bio: 'I am passionate about isiZulu and want to reach more students who need support in the subject. I believe language is best taught by someone who genuinely loves it, and isiZulu is something I am deeply connected to both academically and culturally. My approach focuses on conceptual clarity and cultural understanding, helping students not only improve their marks but develop a genuine appreciation for the language.',
                rate: 300,
                experience: 5,
                qualification: 'Online Teaching Certificate',
                rating: 5.0,
                reviews: 0,
                verified: 1
            },
            {
                email: 'tundecourse@gmail.com',
                name: 'Babatunde Olalekan',
                subjects: 'English,Mathematics,Other',
                grades: '8,9,10,11,12',
                bio: 'My approach focuses on achieving tangible results through personalized mentorship and high-quality resources. I am dedicated to helping students build confidence and reach their academic goals with patience, clarity, and a commitment to excellence. Specializing in Religious studies, English, and Mathematics.',
                rate: 700,
                experience: 3,
                qualification: 'BSc. English',
                rating: 5.0,
                reviews: 0,
                verified: 1
            },
            {
                email: 'wael-fouda@hotmail.com',
                name: 'Wael Hazem Fouda',
                subjects: 'Information Technology,Computer Applications Technology,Other',
                grades: '8,9,10,11,12',
                bio: 'I teach traders to see the market through an institutional lens—understanding price action, market structure, and the psychology behind every move. From foundational syntax to advanced strategy development, I specialize in Technical Analysis, Pine Script, AI and Machine Learning for Trading, and Data Science. Theory without practice has no place in trading education.',
                rate: 370,
                experience: 5,
                qualification: 'Bachelor\'s Degree',
                rating: 5.0,
                reviews: 0,
                verified: 1
            }
        ];

        let results = [];

        for (const tutor of newTutors) {
            let user = await User.findOne({ email: tutor.email });
            if (!user) {
                user = new User({
                    email: tutor.email,
                    password_hash: hash,
                    role: 'tutor',
                    full_name: tutor.name,
                    is_verified: true
                });
                await user.save();
                results.push(`Created user ${tutor.name}`);
            } else {
                results.push(`User ${tutor.name} already exists`);
            }

            let profile = await TutorProfile.findOne({ user_id: user._id });
            if (!profile) {
                profile = new TutorProfile({
                    user_id: user._id,
                    subjects: tutor.subjects,
                    grade_levels: tutor.grades,
                    bio: tutor.bio,
                    hourly_rate: tutor.rate,
                    experience_years: tutor.experience,
                    qualification: tutor.qualification,
                    rating: tutor.rating,
                    review_count: tutor.reviews,
                    verified: tutor.verified
                });
                await profile.save();
                results.push(`Created profile for ${tutor.name}`);
            } else {
                results.push(`Profile for ${tutor.name} already exists`);
            }
        }

        return res.status(200).json({ success: true, results });
    } catch (err) {
        console.error('Seeding error:', err);
        return res.status(500).json({ error: 'Failed to seed db', details: err.message });
    }
};
