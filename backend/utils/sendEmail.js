import { Resend } from "resend";

// Switched from Gmail SMTP to Resend's HTTPS API. Railway (like most container
// platforms) blocks or throttles outbound SMTP on ports 587/465 — emails would
// hang for the full connection timeout and then fail with ETIMEDOUT, even
// though the code and credentials were correct. Resend sends over normal
// HTTPS (443), which is never blocked, and requires a verified sending
// domain (RESEND_FROM_EMAIL) rather than a raw Gmail account.
//
// The client is created lazily (inside sendEmail, not here at module load
// time) because ES module imports all resolve before server.js's own
// dotenv.config() call runs — a top-level `new Resend(process.env.X)` here
// would see an empty env and throw before dotenv ever gets a chance to load it.
let resend;
const getResend = () => {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
};

export const sendEmail = async ({ to, subject, html }) => {
  const { error } = await getResend().emails.send({
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

// Internal admin notification — sent on every new student registration. Not
// shown to the student; just an operational heads-up for whoever runs the site.
export const newRegistrationAdminTemplate = (student) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
    <h2 style="color:#14213D;">New student registered</h2>
    <table style="width:100%; font-size:14px; color:#333; border-collapse: collapse;">
      <tr><td style="padding:4px 0; color:#888;">Name</td><td style="padding:4px 0;">${student.fullName}</td></tr>
      <tr><td style="padding:4px 0; color:#888;">Email</td><td style="padding:4px 0;">${student.email}</td></tr>
      <tr><td style="padding:4px 0; color:#888;">Phone</td><td style="padding:4px 0;">${student.phone || "—"}</td></tr>
      <tr><td style="padding:4px 0; color:#888;">Place</td><td style="padding:4px 0;">${student.place || "—"}</td></tr>
      <tr><td style="padding:4px 0; color:#888;">Course</td><td style="padding:4px 0;">${student.course || "—"}</td></tr>
      <tr><td style="padding:4px 0; color:#888;">Board</td><td style="padding:4px 0;">${student.board || "—"}</td></tr>
      <tr><td style="padding:4px 0; color:#888;">Class</td><td style="padding:4px 0;">${student.currentClass || "—"}</td></tr>
      <tr><td style="padding:4px 0; color:#888;">NEET Year</td><td style="padding:4px 0;">${student.neetExamYear || "—"}</td></tr>
      <tr><td style="padding:4px 0; color:#888;">Referred By</td><td style="padding:4px 0;">${student.referredByCode || "—"}</td></tr>
      <tr><td style="padding:4px 0; color:#888;">Registered At</td><td style="padding:4px 0;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td></tr>
    </table>
    <p style="color:#888; font-size:12px; margin-top:24px;">Raise Academy / YNeet — automated alert</p>
  </div>
`;
