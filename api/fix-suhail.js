const connectDB = require('./_db');
const { User, TutorProfile } = require('./_models');

module.exports = async function handler(req, res) {
    try {
        await connectDB();
        
        // Find users named Suhail Gul Malik
        const users = await User.find({ full_name: 'Suhail Gul Malik' });
        const userIds = users.map(u => u._id);
        
        // Find profiles for these users
        const profiles = await TutorProfile.find({ user_id: { $in: userIds } });
        
        if (profiles.length <= 1) {
            return res.status(200).json({ message: 'No duplicates found', count: profiles.length });
        }
        
        // Keep the first one, delete the rest
        const toDelete = profiles.slice(1).map(p => p._id);
        await TutorProfile.deleteMany({ _id: { $in: toDelete } });
        
        // Also check if there are duplicate users with the same email
        // (though findOne should have prevented this)
        
        return res.status(200).json({ 
            message: 'Duplicates fixed', 
            deleted_count: toDelete.length,
            remaining_count: 1
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
