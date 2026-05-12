const connectDB = require('./_db');
const { User, TutorProfile } = require('./_models');

module.exports = async function handler(req, res) {
    try {
        await connectDB();
        const profiles = await TutorProfile.find().populate('user_id', 'full_name email').lean();
        const names = profiles.map(p => p.user_id?.full_name);
        return res.status(200).json({ names });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
