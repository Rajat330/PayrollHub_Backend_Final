
import mongoose from "mongoose";
import Attendance from "../model/attendance.js";
import userData from "../model/user.js";

// Admin: Get attendance records for a selected date
export const getAttendance = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        message: "A valid attendance date is required (YYYY-MM-DD)",
      });
    }

    const records = await Attendance.find({ date }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Attendance fetched successfully",
      records,
    });
  } catch (error) {
    console.error("Get Attendance Error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch attendance",
    });
  }
};

// Employee: Get only the attendance belonging to the logged-in employee
export const getMyAttendance = async (req, res) => {
  try {
    // This ID must come from the verified JWT set by authenticateToken.
    const employeeId = req.user?.id;

    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(401).json({
        message: "Please log in again to view your attendance.",
      });
    }

    const employee = await userData.findById(employeeId).select("_id role");

    if (!employee || employee.role === "admin") {
      return res.status(403).json({
        message: "Employee access is required to view this attendance.",
      });
    }

    const records = await Attendance.find({ employeeId: employee._id })
      .select("date status checkIn checkOut")
      .sort({ date: -1 })
      .lean();

    return res.status(200).json({
      message: "Your attendance was fetched successfully.",
      records,
    });
  } catch (error) {
    console.error("Get My Attendance Error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch your attendance.",
    });
  }
};

// Admin: Save or update attendance for one employee and date
export const saveAttendance = async (req, res) => {
  try {
    const {
      employeeId,
      date,
      status,
      checkIn = "",
      checkOut = "",
    } = req.body;

    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        message: "A valid employee ID is required",
      });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        message: "A valid attendance date is required",
      });
    }

    const validStatuses = ["Present", "Absent", "Late", "On Leave"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid attendance status",
      });
    }

    if (typeof checkIn !== "string" || typeof checkOut !== "string") {
      return res.status(400).json({
        message: "Check-in and check-out must be strings",
      });
    }

    if ((status === "Present" || status === "Late") && !checkIn) {
      return res.status(400).json({
        message: "Check-in time is required",
      });
    }

    if (
      checkIn &&
      checkOut &&
      checkOut < checkIn &&
      status !== "Absent" &&
      status !== "On Leave"
    ) {
      return res.status(400).json({
        message: "Check-out cannot be earlier than check-in",
      });
    }

    const employee = await userData.findById(employeeId);

    if (!employee || employee.role === "admin") {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const record = await Attendance.findOneAndUpdate(
      { employeeId, date },
      {
        $set: {
          status,
          checkIn: status === "Present" || status === "Late" ? checkIn : "",
          checkOut: status === "Present" || status === "Late" ? checkOut : "",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      message: "Attendance saved successfully",
      record,
    });
  } catch (error) {
    console.error("Save Attendance Error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Attendance already exists. Please try again.",
      });
    }

    return res.status(500).json({
      message: "Failed to save attendance",
    });
  }
};

// Admin: Mark all employees Present for a selected date
export const markAllPresent = async (req, res) => {
  try {
    const { date } = req.body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        message: "A valid attendance date is required",
      });
    }

    const employees = await userData.find({
      role: { $ne: "admin" },
    }).select("_id");

    const operations = employees.map((employee) => ({
      updateOne: {
        filter: {
          employeeId: employee._id,
          date,
        },
        update: {
          $set: {
            status: "Present",
          },
          $setOnInsert: {
            employeeId: employee._id,
            date,
            checkIn: "09:00",
            checkOut: "",
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await Attendance.bulkWrite(operations);
    }

    const records = await Attendance.find({ date });

    return res.status(200).json({
      message: "All employees marked Present",
      records,
    });
  } catch (error) {
    console.error("Mark All Present Error:", error.message);
    return res.status(500).json({
      message: "Failed to mark all employees present",
    });
  }
};
