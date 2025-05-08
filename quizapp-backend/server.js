import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import quizAttemptRoutes from "./routes/quizAttemptRoutes.js";
import quizRoutes from './routes/quizRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import badgeRoutes from "./routes/badgeRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Configure CORS for frontend application
const corsOptions = {
  origin: 'http://localhost:3000', // Allow only the frontend app
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow cookies
  maxAge: 86400 // Cache preflight request results for 1 day (in seconds)
};

app.use(cors(corsOptions));
app.use(express.json());

// Global error handler for JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  next(err);
});

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/quiz', quizRoutes);
app.use("/api/question", questionRoutes);
app.use("/api/quiz-attempts", quizAttemptRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

const PORT = process.env.PORT || 8000; // Changed to 8000 as per requirements
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
