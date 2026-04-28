const { maskEmail } = require("../utils/security");

let nodemailer = null;
try {
  // Optional dependency in local dev. If missing, we keep console fallback mode.
  // eslint-disable-next-line global-require
  nodemailer = require("nodemailer");
} catch (error) {
  nodemailer = null;
}

const smtpEnabled = () =>
  Boolean(
    nodemailer &&
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );

const getTransporter = () => {
  if (!smtpEnabled()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendMail = async ({ to, subject, text, html }) => {
  const transporter = getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@entreskillhub.com";

  if (!transporter) {
    console.log("Email delivery disabled. SMTP is not configured.");
    console.log("Simulated email ->", { to: maskEmail(to), subject, text });
    return { delivered: false };
  }

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });

  return { delivered: true };
};

const sendVerificationCodeEmail = async ({ to, name, code }) =>
  sendMail({
    to,
    subject: "EntreSkill Hub email verification code",
    text: `Hi ${name}, your EntreSkill Hub verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Hi ${name},</p><p>Your EntreSkill Hub verification code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`
  });

const sendPasswordResetEmail = async ({ to, name, resetLink }) =>
  sendMail({
    to,
    subject: "EntreSkill Hub password reset request",
    text: `Hi ${name}, reset your password using this link: ${resetLink}. This link expires in 20 minutes.`,
    html: `<p>Hi ${name},</p><p>Reset your password using this link:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 20 minutes.</p>`
  });

module.exports = {
  sendMail,
  sendPasswordResetEmail,
  sendVerificationCodeEmail
};
