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
  question_order: {
    type: Number,
    required: true,
    default: 0
  },
  selected_answer: {
    type: mongoose.Schema.Types.Mixed, // JSON
    required: true,
  },
  is_correct: {
    type: Boolean,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Add indexes for better query performance
quizAttemptAnswerSchema.index({ attempt_id: 1 });
quizAttemptAnswerSchema.index({ question_id: 1 });
quizAttemptAnswerSchema.index({ attempt_id: 1, question_id: 1 }, { unique: true });
quizAttemptAnswerSchema.index({ created_at: -1 });

// Virtual for getting the question details
quizAttemptAnswerSchema.virtual('question', {
  ref: 'Question',
  localField: 'question_id',
  foreignField: 'id',
  justOne: true
});

// Virtual for getting quiz attempt details
quizAttemptAnswerSchema.virtual('attempt', {
  ref: 'QuizAttempt',
  localField: 'attempt_id',
  foreignField: 'id',
  justOne: true
});

export default mongoose.model("QuizAttemptAnswer", quizAttemptAnswerSchema);
