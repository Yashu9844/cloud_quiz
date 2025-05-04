import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import quizAttemptRoutes from "./routes/quizAttemptRoutes.js";
import quizRoutes from './routes/quizRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import badgeRoutes from "./routes/badgeRoutes.js";
dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/quiz', quizRoutes);
app.use("/api/question", questionRoutes);
app.use("/api/quiz-attempts", quizAttemptRoutes);
app.use("/api/badges", badgeRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
