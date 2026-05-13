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

        const tutor = {
            email: 'Mcanthonyigwe@gmail.com',
            name: 'Mcanthony Igwe',
            subjects: 'Mathematics,Other',
            grades: '8,9,10,11,12',
            bio: 'I am a tutor because I enjoy breaking complex ideas in mathematics and chess into recognizable and digestible patterns that any student can follow. I\'ve worked with students of many different levels throughout my teaching journey, and I have developed a deep understanding of what it takes to make information understandable and manageable.',
            rate: 250,
            experience: 2,
            qualification: 'BSc computer science Eduvos University',
            rating: 5.0,
            reviews: 0,
            verified: 1
        };

        let result = "";

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
            result += `Created user ${tutor.name}. `;
        } else {
            result += `User ${tutor.name} already exists. `;
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
            result += `Created profile for ${tutor.name}.`;
        } else {
            result += `Profile for ${tutor.name} already exists.`;
        }

        return res.status(200).json({ success: true, result });
    } catch (err) {
        console.error('Seeding error:', err);
        return res.status(500).json({ error: 'Failed to seed db', details: err.message });
    }
};
