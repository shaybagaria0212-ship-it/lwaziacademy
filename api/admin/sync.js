const connectDB = require('../_db');
const { User, TutorProfile } = require('../_models');
const tutors = require('../_seed_data');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
    try {
        await connectDB();
        const hash = bcrypt.hashSync('password123', 10);
        
        // NUCLEAR WIPE: Delete all tutor profiles and tutor users first
        await TutorProfile.deleteMany({});
        await User.deleteMany({ role: 'tutor' });
        
        let log = [];

        for (const t of tutors) {
            // Re-create user
            const user = new User({ 
                email: t.email.toLowerCase(), 
                password_hash: hash, 
                role: 'tutor', 
                full_name: t.full_name, 
                is_verified: true 
            });
            await user.save();

            const profile = new TutorProfile({
                user_id: user._id,
                subjects: t.subjects,
                grade_levels: t.grade_levels,
                bio: t.bio,
                hourly_rate: t.hourly_rate,
                experience_years: t.experience_years,
                qualification: t.qualification,
                rating: 5.0,
                verified: 1
            });
            await profile.save();
            log.push(`Fresh sync: ${t.full_name}`);
        }

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(`
            <html>
                <body style="font-family: sans-serif; padding: 40px; line-height: 1.6; color: #333;">
                    <h1 style="color: #2e7d32;">✅ Database Sync Successful</h1>
                    <p>The repository data has been successfully synchronized with the live database.</p>
                    <ul style="background: #f1f8e9; padding: 20px; border-radius: 8px; list-style: none;">
                        ${log.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                    <p><a href="/tutors.html" style="color: #2e7d32; font-weight: bold;">Return to Mentor Directory</a></p>
                </body>
            </html>
        `);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
