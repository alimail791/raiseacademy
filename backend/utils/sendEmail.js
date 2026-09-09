import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // IMPORTANT: many container platforms (Railway included) have broken/unreliable
      // IPv6 routing. Node 18+ tries IPv6 first by default, gets no response, and only
      // falls back to IPv4 after a long OS-level timeout — this is what produces a
      // ~2 minute hang ending in ETIMEDOUT, even though the SMTP server itself is
      // perfectly reachable over IPv4. Forcing IPv4 skips that dead-end entirely.
      family: 4,
      connectionTimeout: 15000, // fail fast (15s) instead of hanging for 2 minutes
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  const info = await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
  return info;
};

export const otpEmailTemplate = (code, purpose) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color:#14213D;">YNeet</h2>
    <p>Your ${purpose === "reset" ? "password reset" : "verification"} code is:</p>
    <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color:#F2A93B; margin: 16px 0;">${code}</div>
    <p>This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
    <p style="color:#888; font-size:12px; margin-top:24px;">YNeet</p>
  </div>
`;
