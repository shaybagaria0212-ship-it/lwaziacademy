const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tutor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    scheduled_at: { type: Date, required: true },
    duration_minutes: { type: Number, default: 60 },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
    notes: { type: String, default: '' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', SessionSchema);
