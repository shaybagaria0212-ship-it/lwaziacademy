const mongoose = require('mongoose');

const TutorProfileSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    subjects: { type: String, required: true },
    grade_levels: { type: String, required: true },
    bio: { type: String, default: '' },
    hourly_rate: { type: Number, default: 0 },
    experience_years: { type: Number, default: 0 },
    qualification: { type: String, default: '' },
    availability: { type: String, default: '[]' },
    rating: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 },
    verified: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TutorProfile', TutorProfileSchema);
