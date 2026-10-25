
import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userData",
      required: true,
    },

    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },

    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },

    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },

    grossSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

payrollSchema.index(
  { employeeId: 1, month: 1 },
  { unique: true }
);

const Payroll = mongoose.model("Payroll", payrollSchema);

export default Payroll;
