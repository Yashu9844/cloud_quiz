import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const quizAttemptAnswerSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  attempt_id: {
    type: String,
    ref: "QuizAttempt",
    required: true,
  },
  question_id: {
    type: String,
    ref: "Question",
    required: true,
  },
  selected_answer: {
    type: mongoose.Schema.Types.Mixed, // JSON
    required: true,
  },
  is_correct: {
    type: Boolean,
    required: true,
  },
});

export default mongoose.model("QuizAttemptAnswer", quizAttemptAnswerSchema);