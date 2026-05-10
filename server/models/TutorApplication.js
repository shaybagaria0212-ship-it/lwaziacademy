const mongoose = require('mongoose');

const TutorApplicationSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    subjects: { type: String, required: true },
    grade_levels: { type: String, required: true },
    qualification: { type: String, required: true },
    experience_years: { type: Number, default: 0 },
    hourly_rate: { type: Number, default: 0 },
    motivation: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'reviewed', 'approved', 'rejected'], default: 'pending' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TutorApplication', TutorApplicationSchema);
