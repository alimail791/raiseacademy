import Testimonial from "../models/Testimonial.js";
import GalleryItem from "../models/GalleryItem.js";
import Student from "../models/Student.js";

// ---------- Testimonials ----------
export const getTestimonials = async (req, res, next) => {
  try {
    const items = await Testimonial.find({ published: true }).sort({ createdAt: -1 });
    res.json({ testimonials: items });
  } catch (err) {
    next(err);
  }
};

export const createTestimonial = async (req, res, next) => {
  try {
    const item = await Testimonial.create(req.body);
    res.status(201).json({ testimonial: item });
  } catch (err) {
    next(err);
  }
};

export const deleteTestimonial = async (req, res, next) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ message: "Testimonial deleted" });
  } catch (err) {
    next(err);
  }
};

// ---------- Gallery ----------
export const getGallery = async (req, res, next) => {
  try {
    const items = await GalleryItem.find({ published: true }).sort({ createdAt: -1 });
    res.json({ gallery: items });
  } catch (err) {
    next(err);
  }
};

export const createGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.create(req.body);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
};

export const deleteGalleryItem = async (req, res, next) => {
  try {
    await GalleryItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Gallery item deleted" });
  } catch (err) {
    next(err);
  }
};

// ---------- Admin: students ----------
export const listStudents = async (req, res, next) => {
  try {
    const students = await Student.find({ role: "student" }).sort({ createdAt: -1 });
    res.json({ students });
  } catch (err) {
    next(err);
  }
};

export const exportStudentsCsv = async (req, res, next) => {
  try {
    const students = await Student.find({ role: "student" }).lean();
    const headers = [
      "fullName",
      "gender",
      "email",
      "phone",
      "place",
      "board",
      "course",
      "currentClass",
      "neetExamYear",
      "yneetSubscribed",
      "createdAt",
    ];
    const rows = students.map((s) =>
      headers.map((h) => JSON.stringify(s[h] ?? "")).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=students.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
};
