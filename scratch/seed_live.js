require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, TutorProfile } = require('../api/_models');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const hash = bcrypt.hashSync('password123', 10);

        const newTutors = [
            {
                email: 'amith.pattar@gmail.com',
                name: 'Amith Pattar',
                subjects: 'Mathematics,Physical Sciences',
                grades: '7,8,9,10,11,12',
                bio: 'I believe effective teaching is not just about solving problems, but helping students deeply understand concepts and develop confidence in their abilities. With an engineering background and several years of experience teaching mathematics to students from different educational backgrounds, I focus on making learning interactive, engaging, and easy to follow. My teaching approach emphasizes conceptual clarity, logical thinking, patience, and step-by-step explanation rather than rote memorization. I strive to create a comfortable learning environment where students feel encouraged to ask questions and actively participate. I am particularly passionate about helping students overcome fear of mathematics and develop genuine interest in the subject. My goal is to help learners improve academically while also building independent problem-solving skills and long-term confidence.',
                rate: 325,
                experience: 5,
                qualification: 'Bachelor’s Degree in Electrical and Electronics Engineering',
                rating: 5.0,
                reviews: 0,
                verified: 1
            },
            {
                email: 'suhail.malik@gmail.com',
                name: 'Suhail Gul Malik',
                subjects: 'Mathematics,English,Economics',
                grades: '8,9,10',
                bio: 'I am applying to become a tutor because I enjoy helping others understand and succeed in their work. I believe that tutoring is not only about teaching information, but also about encouraging confidence, patience, and a positive attitude towards learning. Throughout my school experience, I have often helped classmates with work they struggled to understand, and I found it rewarding to see them improve once concepts were explained clearly. This showed me that I am patient, approachable, and able to communicate ideas in a way that others can understand.',
                rate: 250,
                experience: 5,
                qualification: 'Post Graduation in Economics - Central University of Kashmir',
                rating: 5.0,
                reviews: 0,
                verified: 1
            }
        ];

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
                console.log(`Created user ${tutor.name}`);
            } else {
                console.log(`User ${tutor.name} already exists`);
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
                console.log(`Created profile for ${tutor.name}`);
            } else {
                console.log(`Profile for ${tutor.name} already exists`);
            }
        }

        console.log('✅ Seeding complete');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
