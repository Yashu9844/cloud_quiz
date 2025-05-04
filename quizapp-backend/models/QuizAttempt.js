import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const quizAttemptSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  user_id: {
    type: String,
    ref: "User",
    required: true,
  },
  quiz_id: {
    type: String,
    ref: "Quiz",
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  total_questions: {
    type: Number,
    required: true,
  },
  correct_answers: {
    type: Number,
    required: true,
  },
  time_taken: {
    type: Number, // in seconds
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("QuizAttempt", quizAttemptSchema);