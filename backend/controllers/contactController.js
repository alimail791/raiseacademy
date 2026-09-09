import ContactMessage from "../models/ContactMessage.js";

export const submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "name, email and message are required" });
    }
    const doc = await ContactMessage.create({ name, email, phone, message });
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
