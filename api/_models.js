// Shared Mongoose models for Vercel serverless functions
const mongoose = require('mongoose');

// Prevent model recompilation in serverless hot-reloads
function getModel(name, schema) {
    return mongoose.models[name] || mongoose.model(name, schema);
}

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['student', 'tutor'], required: true },
    full_name: { type: String, required: true, trim: true },
    avatar_url: { type: String, default: null },
    is_verified: { type: Boolean, default: false },
    two_fa_enabled: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
});

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

const VerificationCodeSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true },
    code: { type: String, required: true },
    type: { type: String, enum: ['register', '2fa'], required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }
});

const User = getModel('User', UserSchema);
const TutorProfile = getModel('TutorProfile', TutorProfileSchema);
const VerificationCode = getModel('VerificationCode', VerificationCodeSchema);

module.exports = { User, TutorProfile, VerificationCode };
