
import express from "express";
import {
  createPayroll,
  editPayroll,
  getAllPayroll,
  getMyPayroll,
  updatePayrollStatus,
} from "../controller/payrollController.js";

import authenticateToken from "../utils/authMiddleware.js";
import adminMiddleware from "../utils/adminMiddleware.js";

const router = express.Router();

// Employee: get only their own payroll records
router.get(
  "/api/my-payroll",
  authenticateToken,
  getMyPayroll
);

// Create payroll for an employee (admin only)
router.post(
  "/api/admin/payroll",
  authenticateToken,
  adminMiddleware,
  createPayroll
);

// Get all payroll records (admin only)
router.get(
  "/api/admin/payroll",
  authenticateToken,
  adminMiddleware,
  getAllPayroll
);

// Edit salary details for a Pending payroll record (admin only)
router.patch(
  "/api/admin/payroll/:id",
  authenticateToken,
  adminMiddleware,
  editPayroll
);

// Update payroll status (admin only)
router.patch(
  "/api/admin/payroll/:id/status",
  authenticateToken,
  adminMiddleware,
  updatePayrollStatus
);

export default router;
