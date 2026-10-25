
import mongoose from "mongoose";
import Leave from "../model/Leave.js";
import userData from "../model/user.js";

// Apply for leave
export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
const employeeId = req.user.id;
    if (
      !employeeId ||
      !mongoose.Types.ObjectId.isValid(employeeId)
    ) {
      return res.status(400).json({
        message: "A valid employee ID is required",
      });
    }

    const validLeaveTypes = [
      "Casual Leave",
      "Sick Leave",
      "Paid Leave",
      "Emergency Leave",
    ];

    if (!validLeaveTypes.includes(leaveType)) {
      return res.status(400).json({
        message: "Invalid leave type",
      });
    }

    const isValidDate = (value) => {
      if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
      ) {
        return false;
      }

      const parsed = new Date(`${value}T00:00:00Z`);

      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    };

    if (
      !isValidDate(startDate) ||
      !isValidDate(endDate) ||
      endDate < startDate
    ) {
      return res.status(400).json({
        message: "Please provide valid leave dates",
      });
    }

    if (
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 1000
    ) {
      return res.status(400).json({
        message: "Reason is required and must be under 1000 characters",
      });
    }

    const employee = await userData.findById(employeeId);

    if (!employee || employee.role === "admin") {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const leave = await Leave.create({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
      status: "Pending",
    });

    return res.status(201).json({
      message: "Leave request submitted successfully",
      leave,
    });
  } catch (error) {
    console.error("Apply Leave Error:", error.message);

    return res.status(500).json({
      message: "Failed to submit leave request",
    });
  }
};

// Get leave requests
export const getLeaves = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = {};

    if (status) {
      const validStatuses = ["Pending", "Approved", "Rejected"];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid leave status",
        });
      }

      filter.status = status;
    }

    if (employeeId) {
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({
          message: "Invalid employee ID",
        });
      }

      filter.employeeId = employeeId;
    }

    const leaves = await Leave.find(filter)
      .populate("employeeId", "name email department designation")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Leave requests fetched successfully",
      leaves,
    });
  } catch (error) {
    console.error("Get Leaves Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch leave requests",
    });
  }
};

// Approve or reject a leave request
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid leave request ID",
      });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Approved or Rejected",
      });
    }

    if (
      typeof adminComment !== "string" ||
      adminComment.trim().length > 1000
    ) {
      return res.status(400).json({
        message: "Admin comment must be under 1000 characters",
      });
    }

    const leave = await Leave.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          adminComment: adminComment.trim(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("employeeId", "name email department designation");

    if (!leave) {
      return res.status(404).json({
        message: "Leave request not found",
      });
    }

    return res.status(200).json({
      message: `Leave request ${status.toLowerCase()} successfully`,
      leave,
    });
  } catch (error) {
    console.error("Update Leave Error:", error.message);

    return res.status(500).json({
      message: "Failed to update leave request",
    });
  }
};

// Employee: fetch only their own leave requests
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      employeeId: req.user.id,
    })
      .populate("employeeId", "name email department designation")
      .sort({ createdAt: -1 });

    return res.status(200).json(leaves);
  } catch (error) {
    console.error("Get My Leaves Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch your leave requests",
    });
  }
};