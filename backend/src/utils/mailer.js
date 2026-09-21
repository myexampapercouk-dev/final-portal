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

// Sends a per-child feedback summary email to a parent after a teacher
// submits and finalises a class's feedback. If SMTP isn't configured, logs
// instead of failing so the class-completion flow never breaks locally.
async function sendFeedbackEmail(toEmail, { parentName, childName, className, items }) {
    const lines = items.map((i) => `${i.subject || 'General'}: ${i.content}`).join('\n');
    const htmlItems = items
        .map((i) => `<li><strong>${i.subject || 'General'}:</strong> ${i.content}</li>`)
        .join('');

    if (!transporter) {
        console.log(`[DEV - no SMTP configured] Feedback email for ${toEmail} (${childName} - ${className}):\n${lines}`);
        return { delivered: false };
    }

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: toEmail,
            subject: `Feedback for ${childName} - ${className}`,
            text: `Hi ${parentName},\n\nHere is today's feedback for ${childName} from ${className}:\n\n${lines}`,
            html: `<p>Hi ${parentName},</p><p>Here is today's feedback for <b>${childName}</b> from <b>${className}</b>:</p><ul>${htmlItems}</ul>`
        });
        return { delivered: true };
    } catch (err) {
        console.error('[FEEDBACK EMAIL FAILED]', err.code || '', err.message);
        console.log(`[FALLBACK - SMTP send failed] Feedback email for ${toEmail}:\n${lines}`);
        return { delivered: false };
    }
}

module.exports = { sendOtpEmail, sendFeedbackEmail, smtpConfigured };