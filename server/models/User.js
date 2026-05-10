const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ['student', 'tutor'], required: true },
    full_name: { type: String, required: true },
    avatar_url: { type: String, default: null },
    is_verified: { type: Boolean, default: false },
    two_fa_enabled: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
