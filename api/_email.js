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

async function sendApplicationNotification(adminEmail, applicationData) {
    const transporter = getTransporter();
    const { full_name, email, phone, subjects, grade_levels, qualification, experience_years, hourly_rate, motivation } = applicationData;
    
    await transporter.sendMail({
        from: `"Lwazi Academy System" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `New Tutor Application: ${full_name}`,
        html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e9e7eb;border-radius:12px;">
                <h1 style="color:#002147;font-size:24px;margin:0 0 20px;border-bottom:2px solid #f2e9d2;padding-bottom:12px;">New Tutor Application</h1>
                
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                    <tr><td style="padding:8px 0;color:#74777f;width:140px;">Full Name:</td><td style="padding:8px 0;color:#002147;font-weight:bold;">${full_name}</td></tr>
                    <tr><td style="padding:8px 0;color:#74777f;">Email:</td><td style="padding:8px 0;color:#002147;">${email}</td></tr>
                    <tr><td style="padding:8px 0;color:#74777f;">Phone:</td><td style="padding:8px 0;color:#002147;">${phone || 'N/A'}</td></tr>
                    <tr><td style="padding:8px 0;color:#74777f;">Subjects:</td><td style="padding:8px 0;color:#002147;">${subjects}</td></tr>
                    <tr><td style="padding:8px 0;color:#74777f;">Grade Levels:</td><td style="padding:8px 0;color:#002147;">${grade_levels}</td></tr>
                    <tr><td style="padding:8px 0;color:#74777f;">Qualification:</td><td style="padding:8px 0;color:#002147;">${qualification}</td></tr>
                    <tr><td style="padding:8px 0;color:#74777f;">Experience:</td><td style="padding:8px 0;color:#002147;">${experience_years} years</td></tr>
                    <tr><td style="padding:8px 0;color:#74777f;">Hourly Rate:</td><td style="padding:8px 0;color:#002147;">R${hourly_rate}</td></tr>
                </table>

                <div style="background:#faf9fd;padding:20px;border-radius:8px;border:1px solid #e9e7eb;">
                    <p style="color:#74777f;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Motivation</p>
                    <p style="color:#44474e;font-size:15px;margin:0;line-height:1.6;">${motivation || 'No motivation provided.'}</p>
                </div>
                
                <div style="margin-top:32px;text-align:center;">
                    <a href="https://lwaziacademy.vercel.app/admin" style="background:#002147;color:#f2e9d2;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Review in Admin Panel</a>
                </div>
            </div>
        `
    });
}

module.exports = { sendVerificationEmail, send2FAEmail, sendApplicationNotification };
