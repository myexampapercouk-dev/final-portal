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

// Escape text before putting it in the HTML body (a password can contain < > &).
const escapeHtml = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Sent when the admin creates a brand-new parent account for a child. It carries
// the temporary password the admin set, so the parent can sign in straight away.
async function sendParentCreatedEmail(toEmail, { parentName, childName, category, password }) {
    const portalUrl = process.env.PORTAL_URL || 'https://portal.myexampapers.co.uk';
    const link = `${portalUrl}/login`;

    if (!transporter) {
        console.log(`[DEV - no SMTP configured] Parent-account-created email for ${toEmail} (${childName} ${category})`);
        return { delivered: false };
    }

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: toEmail,
            subject: `Your parent account is ready - ${childName} has been added`,
            text: `Hi ${parentName},\n\nA parent account has been created for you and ${childName} (${category}) has been added to it.\n\nSign in with:\nEmail: ${toEmail}\nTemporary password: ${password}\n\nSign in here: ${link}`,
            html: `<p>Hi ${escapeHtml(parentName)},</p><p>A parent account has been created for you, and <b>${escapeHtml(childName)}</b> (${escapeHtml(category)}) has been added to it.</p><p>Sign in with:</p><p style="margin:0">Email: <b>${escapeHtml(toEmail)}</b></p><p style="margin:4px 0 16px">Temporary password: <b style="font-family:monospace;background:#f3efe4;padding:2px 8px;border-radius:6px">${escapeHtml(password)}</b></p><p><a href="${link}" style="display:inline-block;background:#C9A227;color:#16243D;padding:12px 22px;border-radius:8px;font-weight:700;text-decoration:none">Sign in to the portal</a></p>`
        });
        return { delivered: true };
    } catch (err) {
        console.error('[PARENT CREATED EMAIL FAILED]', err.code || '', err.message);
        return { delivered: false };
    }
}

// Sent when the admin links a child to an existing parent's account.
async function sendChildLinkedEmail(toEmail, { parentName, childName, category }) {
    const portalUrl = process.env.PORTAL_URL || 'https://portal.myexampapers.co.uk';
    const link = `${portalUrl}/parent`;

    if (!transporter) {
        console.log(`[DEV - no SMTP configured] Child-linked email for ${toEmail} (${childName} ${category})`);
        return { delivered: false };
    }

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: toEmail,
            subject: `${childName} has been added to your account`,
            text: `Hi ${parentName},\n\n${childName} (${category}) has been added to your parent account. You can now see their classes, feedback and homework in the portal.\n\nOpen the portal: ${link}`,
            html: `<p>Hi ${parentName},</p><p><b>${childName}</b> (${category}) has been added to your parent account.</p><p>You can now see their classes, feedback and homework in the portal.</p><p><a href="${link}" style="display:inline-block;background:#C9A227;color:#16243D;padding:12px 22px;border-radius:8px;font-weight:700;text-decoration:none">Open the portal</a></p>`
        });
        return { delivered: true };
    } catch (err) {
        console.error('[CHILD LINKED EMAIL FAILED]', err.code || '', err.message);
        return { delivered: false };
    }
}

// Sent as soon as the teacher completes a class: tells the parent THIS child's
// class is done. It carries no feedback - that follows once admin approves it.
async function sendClassCompletedEmail(toEmail, { parentName, childName, className }) {
    const portalUrl = process.env.PORTAL_URL || 'https://portal.myexampapers.co.uk';
    const link = `${portalUrl}/parent`;

    if (!transporter) {
        console.log(`[DEV - no SMTP configured] Class-completed email for ${toEmail} (${childName} - ${className})`);
        return { delivered: false };
    }

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: toEmail,
            subject: `${className} completed for ${childName}`,
            text: `Hi ${parentName},\n\n${className} has been completed for ${childName}. The teacher's feedback is being reviewed and you will get another email as soon as it is available.\n\nPortal: ${link}`,
            html: `<p>Hi ${parentName},</p><p><b>${className}</b> has been completed for <b>${childName}</b>.</p><p>The teacher's feedback is being reviewed. You will receive another email as soon as it is available.</p><p><a href="${link}" style="display:inline-block;background:#16243D;color:#ffffff;padding:12px 22px;border-radius:8px;font-weight:700;text-decoration:none">Open the portal</a></p>`
        });
        return { delivered: true };
    } catch (err) {
        console.error('[CLASS COMPLETED EMAIL FAILED]', err.code || '', err.message);
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
            subject: `Feedback for ${childName} from ${className} is now available`,
            text: `Hi ${parentName},\n\nThe teacher's feedback for ${childName} from ${className} is now available.\n\nView it in the portal: ${link}`,
            html: `<p>Hi ${parentName},</p><p>The teacher's feedback for <b>${childName}</b> from <b>${className}</b> is now available.</p><p><a href="${link}" style="display:inline-block;background:#C9A227;color:#16243D;padding:12px 22px;border-radius:8px;font-weight:700;text-decoration:none">View in portal</a></p>`
        });
        return { delivered: true };
    } catch (err) {
        console.error('[FEEDBACK EMAIL FAILED]', err.code || '', err.message);
        return { delivered: false };
    }
}

module.exports = { sendOtpEmail, sendParentCreatedEmail, sendChildLinkedEmail, sendClassCompletedEmail, sendFeedbackReadyEmail, smtpConfigured };
