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
  status: {
    type: String,
    enum: ["IN_PROGRESS", "COMPLETED", "ABANDONED"],
    default: "IN_PROGRESS",
    required: true,
  },
  score: {
    type: Number,
    required: false,
    default: null,
  },
  total_questions: {
    type: Number,
    required: false,
    default: null,
  },
  correct_answers: {
    type: Number,
    required: false,
    default: null,
  },
  time_taken: {
    type: Number, // in seconds
    required: false,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  completed_at: {
    type: Date,
    default: null,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Add indexes for better query performance
quizAttemptSchema.index({ user_id: 1 });
quizAttemptSchema.index({ quiz_id: 1 });
quizAttemptSchema.index({ user_id: 1, quiz_id: 1 });
quizAttemptSchema.index({ created_at: -1 });

// Virtual for getting all answers for this attempt
quizAttemptSchema.virtual('answers', {
  ref: 'QuizAttemptAnswer',
  localField: 'id',
  foreignField: 'attempt_id',
  justOne: false, // Set to false since one attempt has many answers
});

export default mongoose.model("QuizAttempt", quizAttemptSchema);
