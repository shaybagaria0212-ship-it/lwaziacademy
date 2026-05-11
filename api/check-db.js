const connectDB = require('./_db');
const { User, TutorProfile } = require('./_models');

module.exports = async function handler(req, res) {
    try {
        await connectDB();
        const profiles = await TutorProfile.find().populate('user_id', 'full_name email').lean();
        
        const tutors = profiles.map(p => ({
            profile_id: p._id,
            user_id: p.user_id?._id,
            name: p.user_id?.full_name,
            email: p.user_id?.email
        }));

        return res.status(200).json({ tutors });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
