
import mongoose from "mongoose";
import Payroll from "../model/Payroll.js";
import userData from "../model/user.js";

// Create payroll for an employee
export const createPayroll = async (req, res) => {
  try {
    const { employeeId, month, basicSalary, allowances = 0, deductions = 0 } = req.body;

    if (!employeeId || !month || basicSalary === undefined) {
      return res.status(400).json({
        message: "Employee, month and basic salary are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: "Invalid employee ID." });
    }

    if (
  typeof month !== "string" ||
  !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
) {
      return res.status(400).json({
        message: "Month must be in YYYY-MM format.",
      });
    }

    const amounts = [basicSalary, allowances, deductions];

    if (
      amounts.some(
        (amount) =>
          typeof amount !== "number" ||
          !Number.isFinite(amount) ||
          amount < 0
      )
    ) {
      return res.status(400).json({
        message: "Salary amounts must be valid non-negative numbers.",
      });
    }

    if (deductions > basicSalary + allowances) {
      return res.status(400).json({
        message: "Deductions cannot exceed gross salary.",
      });
    }

    const employee = await userData.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    if (employee.role === "admin") {
      return res.status(400).json({
        message: "Payroll cannot be created for an admin account.",
      });
    }

    const grossSalary = basicSalary + allowances;
    const netSalary = grossSalary - deductions;

    const payroll = await Payroll.create({
      employeeId,
      month,
      basicSalary,
      allowances,
      deductions,
      grossSalary,
      netSalary,
    });

    return res.status(201).json({
      message: "Payroll created successfully.",
      payroll,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Payroll already exists for this employee and month.",
      });
    }

    console.error("Create Payroll Error:", error.message);
    return res.status(500).json({ message: "Failed to create payroll." });
  }
};

// Get all payroll records (admin only; protected in payrollRoute.js)
export const getAllPayroll = async (req, res) => {
  try {
    const { month, status, employeeId } = req.query;
    const filter = {};

    if (month) {
      if (
  typeof month !== "string" ||
  !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
) {
        return res.status(400).json({ message: "Invalid month format." });
      }
      filter.month = month;
    }

    if (status) {
      if (!["Pending", "Paid"].includes(status)) {
        return res.status(400).json({ message: "Invalid payroll status." });
      }
      filter.status = status;
    }

    if (employeeId) {
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({ message: "Invalid employee ID." });
      }
      filter.employeeId = employeeId;
    }

    const payroll = await Payroll.find(filter)
      .populate("employeeId", "name email department designation")
      .sort({ month: -1, createdAt: -1 });

    return res.status(200).json({
      message: "Payroll records fetched successfully.",
      payroll,
    });
  } catch (error) {
    console.error("Get Payroll Error:", error.message);
    return res.status(500).json({ message: "Failed to fetch payroll records." });
  }
};

// Get payroll records for the currently authenticated employee only
export const getMyPayroll = async (req, res) => {
  try {
    // authMiddleware is expected to set req.user.id from the verified JWT.
    const userId = req.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Please log in again to view your salary history." });
    }

    const employee = await userData.findById(userId).select("_id role");

    if (!employee) {
      return res.status(404).json({ message: "Employee account not found." });
    }

    if (employee.role === "admin") {
      return res.status(403).json({ message: "This endpoint is for employee accounts only." });
    }

    const payroll = await Payroll.find({ employeeId: employee._id })
      .select("employeeId month basicSalary allowances deductions grossSalary netSalary status paidAt createdAt updatedAt")
      .sort({ month: -1, createdAt: -1 });

    return res.status(200).json({
      message: "Your payroll records fetched successfully.",
      payroll,
    });
  } catch (error) {
    console.error("Get My Payroll Error:", error.message);
    return res.status(500).json({ message: "Failed to fetch your salary history." });
  }
};

// Edit salary details for a Pending payroll record
export const editPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { basicSalary, allowances = 0, deductions = 0 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid payroll ID." });
    }

    const amounts = [basicSalary, allowances, deductions];

    if (
      basicSalary === undefined ||
      amounts.some(
        (amount) =>
          typeof amount !== "number" ||
          !Number.isFinite(amount) ||
          amount < 0
      )
    ) {
      return res.status(400).json({
        message: "Basic salary, allowances and deductions must be valid non-negative numbers.",
      });
    }

    const grossSalary = basicSalary + allowances;
    if (deductions > grossSalary) {
      return res.status(400).json({
        message: "Deductions cannot exceed gross salary.",
      });
    }

    const payroll = await Payroll.findById(id);

    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found." });
    }

    if (payroll.status === "Paid") {
      return res.status(400).json({
        message: "Paid payroll records cannot be edited.",
      });
    }

    payroll.basicSalary = basicSalary;
    payroll.allowances = allowances;
    payroll.deductions = deductions;
    payroll.grossSalary = grossSalary;
    payroll.netSalary = grossSalary - deductions;

    await payroll.save();

    const updatedPayroll = await Payroll.findById(payroll._id).populate(
      "employeeId",
      "name email department designation"
    );

    return res.status(200).json({
      message: "Payroll updated successfully.",
      payroll: updatedPayroll,
    });
  } catch (error) {
    console.error("Edit Payroll Error:", error.message);
    return res.status(500).json({ message: "Failed to edit payroll." });
  }
};

// Update payroll status
export const updatePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid payroll ID." });
    }

    if (!["Pending", "Paid"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Pending or Paid.",
      });
    }

    const payroll = await Payroll.findById(id);

    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found." });
    }

    if (payroll.status === "Paid" && status === "Pending") {
      return res.status(400).json({
        message: "A paid payroll cannot be changed back to Pending.",
      });
    }

    payroll.status = status;
    payroll.paidAt = status === "Paid" ? new Date() : null;

    await payroll.save();

    return res.status(200).json({
      message: `Payroll marked as ${status}.`,
      payroll,
    });
  } catch (error) {
    console.error("Update Payroll Status Error:", error.message);
    return res.status(500).json({
      message: "Failed to update payroll status.",
    });
  }
};
