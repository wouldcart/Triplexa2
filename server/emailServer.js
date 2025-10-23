import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
app.use(cors());
app.use(express.json());

// Create a transporter using env or ephemeral Ethereal for testing
async function createTransporter(overrides = {}) {
  const {
    smtp_host,
    smtp_port,
    smtp_secure,
    smtp_user,
    smtp_password
  } = overrides;

  // If overrides are provided, prefer them
  if (smtp_host && smtp_port && smtp_user && smtp_password) {
    return nodemailer.createTransport({
      host: smtp_host,
      port: Number(smtp_port),
      secure: smtp_secure === true || smtp_secure === 'true' || Number(smtp_port) === 465,
      auth: {
        user: smtp_user,
        pass: smtp_password
      }
    });
  }

  // Else, try environment
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  // Fallback: ephemeral Ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html, config } = req.body || {};
    if (!to || !subject || !html) {
      return res.status(400).json({ success: false, error: 'Missing required fields: to, subject, html' });
    }

    const transporter = await createTransporter(config || {});

    const fromEmail = (config && config.from_email) || process.env.FROM_EMAIL || 'no-reply@example.com';
    const fromName = (config && config.from_name) || process.env.FROM_NAME || 'Triplexa System';

    const info = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    res.json({ success: true, messageId: info.messageId, previewUrl });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ success: false, error: error.message || 'Send failed' });
  }
});

const PORT = process.env.EMAIL_SERVER_PORT ? Number(process.env.EMAIL_SERVER_PORT) : 3001;
app.listen(PORT, () => {
  console.log(`📧 Email server running on http://localhost:${PORT}`);
});