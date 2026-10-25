
import dns from "node:dns";
import mongoose from "mongoose";

// Fix DNS SRV lookup failures on Windows
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDb = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("MONGODB_URI is missing from .env");
    }

    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000
        });

        console.log(
            `Database successfully connected: ${conn.connection.host}`
        );
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
};

export default connectDb;
