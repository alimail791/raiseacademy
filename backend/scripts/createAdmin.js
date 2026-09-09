// Run with: node scripts/createAdmin.js
// Creates (or upgrades) an admin account using ADMIN_EMAIL / ADMIN_PASSWORD from .env
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import Student from "../models/Student.js";
import mongoose from "mongoose";

dotenv.config();

const run = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env first.");
    process.exit(1);
  }

  let admin = await Student.findOne({ email: email.toLowerCase() });
  const hashedPassword = await bcrypt.hash(password, 10);

  if (admin) {
    admin.role = "admin";
    admin.password = hashedPassword;
    await admin.save();
    console.log(`Existing user ${email} upgraded to admin.`);
  } else {
    admin = await Student.create({
      fullName: "YNeet Admin",
      gender: "Other",
      phone: "0000000000",
      email: email.toLowerCase(),
      place: "Avadi, Chennai",
      password: hashedPassword,
      board: "CBSE",
      course: "NEET Coaching",
      role: "admin",
    });
    console.log(`Admin account created for ${email}.`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run();
