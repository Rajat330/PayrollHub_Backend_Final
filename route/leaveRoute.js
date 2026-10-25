
import express from "express";

import {
  applyLeave,
  getLeaves,
  getMyLeaves,
  updateLeaveStatus,
} from "../controller/leaveController.js";

import authenticateToken from "../utils/authMiddleware.js";
import adminMiddleware from "../utils/adminMiddleware.js";

const router = express.Router();

// Employee: apply for leave
router.post(
  "/api/leaves",
  authenticateToken,
  applyLeave
);

// Employee: fetch their own leave requests
router.get(
  "/api/my-leaves",
  authenticateToken,
  getMyLeaves
);

// Admin: fetch all employees' leave requests
router.get(
  "/api/admin/leaves",
  authenticateToken,
  adminMiddleware,
  getLeaves
);

// Admin: approve or reject a leave request
router.patch(
  "/api/admin/leaves/:id/status",
  authenticateToken,
  adminMiddleware,
  updateLeaveStatus
);

export default router;
