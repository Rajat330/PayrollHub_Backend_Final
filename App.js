
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import router from "./route/userRoute.js";
import connectDb from "./config/db.js";
import attendanceRoute from "./route/attendanceRoute.js";
import leaveRoute from "./route/leaveRoute.js";
import payrollRoute from "./route/payrollRoute.js";
import employeeRoute from "./route/employeeRoute.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(router);
app.use(attendanceRoute);
app.use(leaveRoute);
app.use(payrollRoute);
app.use(employeeRoute);

// Home route
app.get("/", (req, res) => {
    res.send("PayrollHub Backend is Running!");
});

// Server configuration
const PORT = process.env.PORT || 5000;

// Connect to MongoDB before starting the server
const startServer = async () => {
    try {
        await connectDb();

        app.listen(PORT, () => {
            console.log(
                `PayrollHub Backend is running on http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "Failed to start PayrollHub backend:",
            error.message
        );
        process.exit(1);
    }
};

startServer();
