
import express from "express";

import {
  getAttendance,
  saveAttendance,
  markAllPresent,
  getMyAttendance,
} from "../controller/attendanceController.js";

import authenticateToken from "../utils/authMiddleware.js";
import adminMiddleware from "../utils/adminMiddleware.js";

const router = express.Router();

// Employee: view only attendance belonging to the verified login token.
router.get(
  "/api/my-attendance",
  authenticateToken,
  getMyAttendance
);

// Admin: fetch attendance for a selected date.
router.get(
  "/api/admin/attendance",
  authenticateToken,
  adminMiddleware,
  getAttendance
);

// Admin: add or update one employee's attendance.
router.post(
  "/api/admin/attendance",
  authenticateToken,
  adminMiddleware,
  saveAttendance
);

// Admin: mark all employees Present.
router.post(
  "/api/admin/attendance/mark-all-present",
  authenticateToken,
  adminMiddleware,
  markAllPresent
);

export default router;
