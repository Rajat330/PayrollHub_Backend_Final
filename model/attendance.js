
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "userData",
    },

    date: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["Present", "Absent", "Late", "On Leave"],
    },

    checkIn: {
      type: String,
      default: "",
    },

    checkOut: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// One attendance record per employee per date
attendanceSchema.index(
  { employeeId: 1, date: 1 },
  { unique: true }
);

const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);

export default Attendance;
