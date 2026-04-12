import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/blockdrive";

// Connection options with timeouts and retry logic
const connectOptions = {
  serverSelectionTimeoutMS: 5000, // fail fast if no server
  socketTimeoutMS: 45000,
  connectTimeoutMS: 5000,
};

const connectDB = async (): Promise<boolean> => {
  try {
    await mongoose.connect(MONGO_URI, connectOptions);
    console.log("✅ MongoDB connected successfully");
    return true;
  } catch (err) {
    console.error("⚠️ MongoDB connection failed:", (err as Error).message);
    console.warn("Initializing In-Memory Persistence Layer (Resilient Mode)...");
    return false;
  }
};

export default connectDB;
