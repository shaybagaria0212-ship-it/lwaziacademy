const mongoose = require('mongoose');

const VerificationCodeSchema = new mongoose.Schema({
    email: { type: String, required: true },
    code: { type: String, required: true },
    type: { type: String, enum: ['register', '2fa'], required: true },
    expiresAt: { type: Date, required: true }
});

module.exports = mongoose.model('VerificationCode', VerificationCodeSchema);
