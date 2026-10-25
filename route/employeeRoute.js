
import express from "express";
import { getEmployeesForPayroll } from "../controller/employeeController.js";
import authenticateToken from "../utils/authMiddleware.js";
import adminMiddleware from "../utils/adminMiddleware.js";

const router = express.Router();

router.get(
  "/api/admin/payroll/employees",
  authenticateToken,
  adminMiddleware,
  getEmployeesForPayroll
);

export default router;
