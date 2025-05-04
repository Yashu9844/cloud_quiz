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
});

export const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;