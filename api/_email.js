// Email service for Vercel serverless
const nodemailer = require('nodemailer');

function getTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

async function sendVerificationEmail(email, code) {
    const transporter = getTransporter();
    await transporter.sendMail({
        from: `"Lwazi Academy" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Lwazi Academy Verification Code',
        html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#faf9fd;border:1px solid #e9e7eb;border-radius:8px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <h1 style="color:#002147;font-size:24px;margin:0 0 4px;">Lwazi Academy</h1>
                    <p style="color:#74777f;font-size:14px;margin:0;">Email Verification</p>
                </div>
                <div style="background:#ffffff;padding:24px;border-radius:6px;border:1px solid #e9e7eb;text-align:center;">
                    <p style="color:#44474e;font-size:15px;margin:0 0 16px;">Your verification code is:</p>
                    <div style="background:#002147;color:#ffffff;font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px 24px;border-radius:6px;display:inline-block;">${code}</div>
                    <p style="color:#74777f;font-size:13px;margin:16px 0 0;">This code expires in 15 minutes.</p>
                </div>
                <p style="color:#74777f;font-size:12px;text-align:center;margin:20px 0 0;">If you didn't request this, please ignore this email.</p>
            </div>
        `
    });
}

async function send2FAEmail(email, code) {
    const transporter = getTransporter();
    await transporter.sendMail({
        from: `"Lwazi Academy" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Lwazi Academy — Login Verification Code',
        html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#faf9fd;border:1px solid #e9e7eb;border-radius:8px;">
                <div style="text-align:center;margin-bottom:24px;">
                    <h1 style="color:#002147;font-size:24px;margin:0 0 4px;">Lwazi Academy</h1>
                    <p style="color:#74777f;font-size:14px;margin:0;">Login Verification</p>
                </div>
                <div style="background:#ffffff;padding:24px;border-radius:6px;border:1px solid #e9e7eb;text-align:center;">
                    <p style="color:#44474e;font-size:15px;margin:0 0 16px;">Your login code is:</p>
                    <div style="background:#002147;color:#ffffff;font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px 24px;border-radius:6px;display:inline-block;">${code}</div>
                    <p style="color:#74777f;font-size:13px;margin:16px 0 0;">This code expires in 15 minutes.</p>
                </div>
                <p style="color:#74777f;font-size:12px;text-align:center;margin:20px 0 0;">If you didn't attempt to log in, please secure your account.</p>
            </div>
        `
    });
}

module.exports = { sendVerificationEmail, send2FAEmail };
