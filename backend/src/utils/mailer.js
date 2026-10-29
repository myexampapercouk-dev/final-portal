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

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: toEmail,
            subject: 'Your Edu Portal verification code',
            text: `Your verification code is ${otpCode}. It expires in 10 minutes.`,
            html: `<p>Your verification code is <b style="font-size:20px;letter-spacing:2px">${otpCode}</b>.</p><p>It expires in 10 minutes.</p>`
        });
        return { delivered: true };
    } catch (err) {
        // SMTP is configured but the provider rejected the send (bad/expired
        // credentials, quota, etc). Don't let a broken mail provider break
        // login — fall back to the same dev-mode behavior as "not configured".
        console.error('[OTP EMAIL FAILED]', err.code || '', err.message);
        console.log(`[FALLBACK - SMTP send failed] OTP for ${toEmail}: ${otpCode}`);
        return { delivered: false };
    }
}

// Tells a parent that admin has approved the feedback for their child's class.
// Only a short message and a button - the feedback itself is read in the portal.
async function sendFeedbackReadyEmail(toEmail, { parentName, childName, className }) {
    const portalUrl = process.env.PORTAL_URL || 'https://portal.myexampapers.co.uk';
    const link = `${portalUrl}/parent`;

    if (!transporter) {
        console.log(`[DEV - no SMTP configured] Feedback-ready email for ${toEmail} (${childName} - ${className}) -> ${link}`);
        return { delivered: false };
    }

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: toEmail,
            subject: `${className} completed - feedback for ${childName} is ready`,
            text: `Hi ${parentName},\n\n${className} has been completed and the teacher's feedback for ${childName} is now available.\n\nView it in the portal: ${link}`,
            html: `<p>Hi ${parentName},</p><p><b>${className}</b> has been completed and the teacher's feedback for <b>${childName}</b> is now available.</p><p><a href="${link}" style="display:inline-block;background:#C9A227;color:#16243D;padding:12px 22px;border-radius:8px;font-weight:700;text-decoration:none">View in portal</a></p>`
        });
        return { delivered: true };
    } catch (err) {
        console.error('[FEEDBACK EMAIL FAILED]', err.code || '', err.message);
        return { delivered: false };
    }
}

module.exports = { sendOtpEmail, sendFeedbackReadyEmail, smtpConfigured };
