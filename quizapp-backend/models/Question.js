import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const QuestionSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  quiz_id: {
    type: String, // store Quiz UUID
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  question_type: {
    type: String,
    enum: ["MCQ", "MULTI_SELECT"],
    required: true,
  },
  options: {
    type: [String], // array of options
    required: true,
  },
  correct_answer: {
    type: [String], // array of correct answers
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Question = mongoose.model("Question", QuestionSchema);
export default Question;
