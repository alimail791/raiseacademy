import jwt from "jsonwebtoken";
import Student from "../models/Student.js";

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Student.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // Single-active-session check: if this account has logged in elsewhere since this
    // token was issued, currentSessionId will have moved on — reject the stale token.
    if (user.currentSessionId && decoded.sid !== user.currentSessionId) {
      return res.status(401).json({ message: "You've been logged out because this account signed in on another device." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid or expired token" });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
