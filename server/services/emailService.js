const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to any email provider
    auth: {
        user: process.env.EMAIL_USER || 'demo@example.com',
        pass: process.env.EMAIL_PASS || 'password'
    }
});

const sendVerificationEmail = async (email, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER || 'demo@example.com',
        to: email,
        subject: 'Your Lwazi Academy Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Welcome to Lwazi Academy!</h2>
                <p>Your verification code is: <strong>${code}</strong></p>
                <p>Please enter this code to complete your registration.</p>
                <p>This code will expire in 15 minutes.</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('Error sending verification email:', err);
    }
};

const send2FAEmail = async (email, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER || 'demo@example.com',
        to: email,
        subject: 'Lwazi Academy Login Verification (2FA)',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Login Attempt</h2>
                <p>Your 2FA verification code is: <strong>${code}</strong></p>
                <p>Please enter this code to securely log in to your account.</p>
                <p>This code will expire in 15 minutes.</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('Error sending 2FA email:', err);
    }
};

module.exports = {
    sendVerificationEmail,
    send2FAEmail
};
