const nodemailer = require('nodemailer');
require('dotenv').config();

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
if (smtpConfigured) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

// Sends a 6-digit OTP email. If no SMTP credentials are configured (local dev),
// it logs the code to the server console instead of failing, so signup still works.
async function sendOtpEmail(toEmail, otpCode) {
    if (!transporter) {
        console.log(`[DEV - no SMTP configured] OTP for ${toEmail}: ${otpCode}`);
        return { delivered: false };
    }

    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject: 'Your Edu Portal verification code',
        text: `Your verification code is ${otpCode}. It expires in 10 minutes.`,
        html: `<p>Your verification code is <b style="font-size:20px;letter-spacing:2px">${otpCode}</b>.</p><p>It expires in 10 minutes.</p>`
    });
    return { delivered: true };
}

module.exports = { sendOtpEmail, smtpConfigured };