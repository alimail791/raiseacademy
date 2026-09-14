import { Resend } from "resend";

// Switched from Gmail SMTP to Resend's HTTPS API. Railway (like most container
// platforms) blocks or throttles outbound SMTP on ports 587/465 — emails would
// hang for the full connection timeout and then fail with ETIMEDOUT, even
// though the code and credentials were correct. Resend sends over normal
// HTTPS (443), which is never blocked, and requires a verified sending
// domain (RESEND_FROM_EMAIL) rather than a raw Gmail account.
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "YNeet <noreply@yneet.in>",
    to,
    subject,
    html,
  });
  if (error) throw new Error(error.message || "Failed to send email via Resend");
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
