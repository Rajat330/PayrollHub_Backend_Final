
import express from "express";
import {
  addUser,
  loginuser,
  getUser,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controller/userDataController.js";

import {
  getMyProfile,
  updateMyProfile,
} from "../controller/profileController.js";

import authenticateToken from "../utils/authMiddleware.js";
import adminMiddleware from "../utils/adminMiddleware.js";

const router = express.Router();

// Public employee registration
router.post("/api/add-user", addUser);

// Public login
router.post("/api/login", loginuser);

// Employee self-service profile routes
// These routes use the authenticated user's ID from the JWT, not an ID supplied by the client.
router.get("/api/my-profile", authenticateToken, getMyProfile);
router.put("/api/my-profile", authenticateToken, updateMyProfile);

// Admin-only employee list
router.get(
  "/api/get-user",
  authenticateToken,
  adminMiddleware,
  getUser
);

// Admin-only employee creation
router.post(
  "/api/admin/employees",
  authenticateToken,
  adminMiddleware,
  createEmployee
);

// Admin-only employee update
router.put(
  "/api/admin/employees/:id",
  authenticateToken,
  adminMiddleware,
  updateEmployee
);

// Admin-only employee deletion
router.delete(
  "/api/admin/employees/:id",
  authenticateToken,
  adminMiddleware,
  deleteEmployee
);

export default router;
