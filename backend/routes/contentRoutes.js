import express from "express";
import {
  getTestimonials,
  createTestimonial,
  deleteTestimonial,
  getGallery,
  createGalleryItem,
  deleteGalleryItem,
  listStudents,
  exportStudentsCsv, signupSources, trialsEnding,
  deleteStudent,
} from "../controllers/contentController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// Public
router.get("/testimonials", getTestimonials);
router.get("/gallery", getGallery);

// Admin only
router.post("/testimonials", protect, adminOnly, createTestimonial);
router.delete("/testimonials/:id", protect, adminOnly, deleteTestimonial);
router.post("/gallery", protect, adminOnly, createGalleryItem);
router.delete("/gallery/:id", protect, adminOnly, deleteGalleryItem);
router.get("/students", protect, adminOnly, listStudents);
router.get("/students/export", protect, adminOnly, exportStudentsCsv);
router.get("/signup-sources", protect, adminOnly, signupSources);
router.get("/trials-ending", protect, adminOnly, trialsEnding);
router.delete("/students/:id", protect, adminOnly, deleteStudent);

export default router;
