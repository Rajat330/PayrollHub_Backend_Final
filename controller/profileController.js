
import mongoose from "mongoose";
import userData from "../model/user.js";

// Return only the currently authenticated employee's profile.
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Please log in again." });
    }

    const user = await userData
      .findById(userId)
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "Profile not found." });
    }

    return res.status(200).json({
      message: "Profile fetched successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        department: user.department || "",
        designation: user.designation || "",
        status: user.status,
        photo: user.photo || "",
      },
    });
  } catch (error) {
    console.error("Get My Profile Error:", error.message);
    return res.status(500).json({ message: "Failed to fetch profile." });
  }
};

// Allow an employee to edit their own basic profile details only.
// Role, account status and password are intentionally not editable here.
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Please log in again." });
    }

    const { name, phone, photo } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }

    const cleanName = name.trim();
    if (cleanName.length > 100) {
      return res.status(400).json({ message: "Name cannot exceed 100 characters." });
    }

    let cleanPhone;
    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return res.status(400).json({ message: "Phone must be text." });
      }
      cleanPhone = phone.trim();
      if (cleanPhone && !/^\+?[0-9\s()-]{7,20}$/.test(cleanPhone)) {
        return res.status(400).json({ message: "Enter a valid phone number." });
      }
    }

    let cleanPhoto;
    if (photo !== undefined) {
      if (typeof photo !== "string") {
        return res.status(400).json({ message: "Photo must be a URL or image data string." });
      }
      cleanPhoto = photo.trim();
      if (cleanPhoto.length > 2_000_000) {
        return res.status(400).json({ message: "Photo data is too large." });
      }
    }

    const user = await userData.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Profile not found." });
    }

    // Never allow this self-service endpoint to edit an administrator account.
    if (user.role !== "employee") {
      return res.status(403).json({ message: "This profile endpoint is for employees only." });
    }

    user.name = cleanName;
    if (cleanPhone !== undefined) user.phone = cleanPhone;
    if (cleanPhoto !== undefined) user.photo = cleanPhoto;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        department: user.department || "",
        designation: user.designation || "",
        status: user.status,
        photo: user.photo || "",
      },
    });
  } catch (error) {
    console.error("Update My Profile Error:", error.message);
    return res.status(500).json({ message: "Failed to update profile." });
  }
};
