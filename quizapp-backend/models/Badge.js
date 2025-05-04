import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const BadgeSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    enum: ["Beginner", "Intermediate", "Pro"], // restrict to these 3
  },
  description: {
    type: String,
    required: true,
  },
  min_score_threshold: {
    type: Number,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  }
});

const Badge = mongoose.model("Badge", BadgeSchema);
export default Badge;
