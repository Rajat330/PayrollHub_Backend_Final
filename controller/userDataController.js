import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import userData from "../model/user.js";

// Register Employee
export const addUser = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existingUser = await userData.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new userData({
            name,
            email: email.toLowerCase().trim(),
            phone,
            password: hashedPassword,
            role: "employee"
        });

        await newUser.save();

        return res.status(201).json({
            message: "Registration successful",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error("Registration Error:", error.message);

        return res.status(500).json({
            message: "Registration failed"
        });
    }
};

 
// Login User
export const loginuser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await userData.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login Error:", error.message);

        return res.status(500).json({
            message: "Login failed"
        });
    }
};

export const createAdmin = async (req, res) => {
    try {
        const email = "admin@payrollhub.com";
        const { password, setupKey } = req.body;

        if (!process.env.ADMIN_SETUP_KEY ||
            setupKey !== process.env.ADMIN_SETUP_KEY) {
            return res.status(403).json({
                message: "Not authorized"
            });
        }

        if (!password || password.length < 12) {
            return res.status(400).json({
                message: "Admin password must be at least 12 characters"
            });
        }

        const existingAdmin = await userData.findOne({ email });

        if (existingAdmin) {
            return res.status(409).json({
                message: "Admin account already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const admin = await userData.create({
            name: "PayrollHub Admin",
            email,
            password: hashedPassword,
            role: "admin"
        });

        return res.status(201).json({
            message: "Admin account created successfully",
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error("Admin Setup Error:", error.message);

        return res.status(500).json({
            message: "Admin setup failed"
        });
    }
};

export const getUser = async (req, res) => {
    try {
        const users = await userData.find()
            .select("-password");

        return res.status(200).json({
            message: "Users fetched successfully",
            users
        });
    } catch (error) {
        console.error("Get Users Error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch users"
        });
    }
};

export const createEmployee = async (req, res) => {
  try {
    const { name, email, phone, department, designation, status, photo, password } = req.body;

    if (!name?.trim() || !email?.trim() || !phone?.trim() ||
        !department?.trim() || !designation?.trim()) {
      return res.status(400).json({
        message: "Name, email, phone, department and designation are required",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({ message: "Phone must be 10 digits" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await userData.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const generatedPassword =
      password || `${cryptoRandomPassword()}Aa1!`;

    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const employee = await userData.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "employee",
      department: department.trim(),
      designation: designation.trim(),
      status: status === "Inactive" ? "Inactive" : "Active",
      photo: photo || "",
    });

    return res.status(201).json({
      message: "Employee created successfully",
      user: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        department: employee.department,
        designation: employee.designation,
        status: employee.status,
        photo: employee.photo,
      },
    });
  } catch (error) {
    console.error("Create Employee Error:", error.message);
    return res.status(500).json({ message: "Failed to create employee" });
  }
};

function cryptoRandomPassword() {
  return `${Math.random().toString(36).slice(2)}${Date.now()}`;
}

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      department,
      designation,
      status,
      photo,
    } = req.body;

    // Validate required fields
    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !department?.trim() ||
      !designation?.trim()
    ) {
      return res.status(400).json({
        message:
          "Name, email, phone, department and designation are required",
      });
    }

    // Validate email
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Invalid email address",
      });
    }

    // Validate phone
    if (!/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({
        message: "Phone must be 10 digits",
      });
    }

    if (status && !["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Active or Inactive",
      });
    }

    // Find employee
    const employee = await userData.findById(id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Do not allow editing an admin through this endpoint
    if (employee.role === "admin") {
      return res.status(403).json({
        message: "Admin account cannot be edited here",
      });
    }

    // Prevent duplicate email addresses
    const existingUser = await userData.findOne({
      email: normalizedEmail,
      _id: { $ne: employee._id },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered to another user",
      });
    }

    // Update employee details without changing password or role
    employee.name = name.trim();
    employee.email = normalizedEmail;
    employee.phone = phone.trim();
    employee.department = department.trim();
    employee.designation = designation.trim();
    employee.status = status || employee.status || "Active";

    if (photo !== undefined) {
      employee.photo = photo;
    }

    await employee.save();

    return res.status(200).json({
      message: "Employee updated successfully",
      user: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        department: employee.department,
        designation: employee.designation,
        status: employee.status,
        photo: employee.photo || "",
      },
    });
  } catch (error) {
    console.error("Update Employee Error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    return res.status(500).json({
      message: "Failed to update employee",
    });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const employee = await userData.findById(id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Prevent deleting the admin account
    if (employee.role === "admin") {
      return res.status(403).json({
        message: "Admin account cannot be deleted here",
      });
    }

    await userData.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Employee deleted successfully",
      id: String(id),
    });
  } catch (error) {
    console.error("Delete Employee Error:", error.message);

    return res.status(500).json({
      message: "Failed to delete employee",
    });
  }
};
