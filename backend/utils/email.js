const nodemailer = require('nodemailer');

const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

if (process.env.SMTP_SERVICE) {
  smtpConfig.service = process.env.SMTP_SERVICE;
}

const transporter = nodemailer.createTransport(smtpConfig);

async function verifySmtpConnection() {
  try {
    await transporter.verify();
    console.log('[email] SMTP connection verified');
  } catch (err) {
    console.warn('[email] SMTP verification failed:', err.message);
    if (process.env.SMTP_HOST === 'smtp.gmail.com') {
      console.warn('[email] Gmail requires an app password or OAuth2 settings for SMTP access.');
    }
  }
}

async function sendOtpEmail(to, otp) {
  if (!to || !otp) {
    throw new Error('Missing recipient or OTP for email delivery');
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || `no-reply@${process.env.SMTP_HOST || 'localhost'}`,
    to,
    subject: 'Your login OTP code',
    text: `Your login OTP code is ${otp}. It expires in 2 minutes. If you did not request it, ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;">
        <h2>Your login OTP</h2>
        <p>Your one-time login code is:</p>
        <p style="font-size:1.5rem;font-weight:bold;">${otp}</p>
        <p>This code expires in 2 minutes.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail, verifySmtpConnection };
