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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
QuestionSchema.index({ id: 1 }, { unique: true });
QuestionSchema.index({ quiz_id: 1 }); // Index for looking up questions by quiz

// Add virtual for quiz reference
QuestionSchema.virtual('quiz', {
  ref: 'Quiz',
  localField: 'quiz_id',
  foreignField: 'id',
  justOne: true // One question belongs to one quiz
});

// Pre-save middleware to ensure quiz_id is a valid string
QuestionSchema.pre('save', function(next) {
  if (!this.quiz_id || typeof this.quiz_id !== 'string') {
    return next(new Error('quiz_id must be a valid string'));
  }
  next();
});

const Question = mongoose.model("Question", QuestionSchema);
export default Question;
