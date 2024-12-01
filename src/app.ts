import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chatRoutes.js";
import { startBot } from "./controllers/telegramController.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection with proper options
// mongoose
//   .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agent_rag", {
//     serverSelectionTimeoutMS: 5000,
//     socketTimeoutMS: 45000,
//   })
//   .then(() => console.log("MongoDB connected successfully"))
//   .catch((err) => {
//     console.error("MongoDB connection error:", err);
//     process.exit(1); // Exit if can't connect to DB
//   });

// // Handle MongoDB connection errors
// mongoose.connection.on("error", (err) => {
//   console.error("MongoDB connection error:", err);
// });

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/chat", chatRoutes);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

let botInstance: any = null;  // Store bot instance reference

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start bot once when server starts
  startBot().then(bot => {
    botInstance = bot;
  }).catch(error => {
    console.error('Initial bot startup error:', error);
  });
});

export default app;

