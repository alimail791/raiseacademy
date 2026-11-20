import ContactMessage from "../models/ContactMessage.js";
import { sendEmail } from "../utils/sendEmail.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "name, email and message are required" });
    }
    const doc = await ContactMessage.create({ name, email, phone, message });
    // Advertise enquiries (www.yneet.in/advertise) also email the admin right away.
    if (req.body.source === "advertise") {
      sendEmail({
        to: process.env.ADMIN_ALERT_EMAIL || "alimail791@gmail.com",
        subject: `New advertising enquiry: ${String(name).slice(0, 60)}`,
        html: `<p><b>${esc(name)}</b> · ${esc(phone)} · ${esc(email)}</p><pre style="font-family:inherit;white-space:pre-wrap">${esc(message)}</pre>`,
      }).catch((e) => console.error("advertise enquiry email failed:", e.message));
    }
    res.status(201).json({ message: "Thanks! We'll get back to you shortly.", id: doc._id });
  } catch (err) {
    next(err);
  }
};

export const listContacts = async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
};
