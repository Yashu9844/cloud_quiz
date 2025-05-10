import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const quizSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4, // Generate UUID automatically
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  topic: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD'],
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

// Add index for the 'id' field for better lookup performance
quizSchema.index({ id: 1 }, { unique: true });
quizSchema.index({ topic: 1 }); // Add index on topic for faster filtering

// Virtual for getting all questions for this quiz
quizSchema.virtual('questions', {
  ref: 'Question',
  localField: 'id',
  foreignField: 'quiz_id',
  justOne: false // One quiz has many questions
});

export const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
