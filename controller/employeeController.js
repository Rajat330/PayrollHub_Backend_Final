
import userData from "../model/user.js";

// Get all employees for admin payroll
export const getEmployeesForPayroll = async (req, res) => {
  try {
    const employees = await userData
      .find({ role: "employee" })
      .select("_id name email department designation status")
      .sort({ name: 1 });

    return res.status(200).json({
      message: "Employees fetched successfully.",
      employees,
    });
  } catch (error) {
    console.error("Get Employees Error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch employees.",
    });
  }
};
