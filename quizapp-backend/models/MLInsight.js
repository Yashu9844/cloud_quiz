import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const MLInsightSchema = new mongoose.Schema({
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
  weak_topics: {
    type: [String],
    default: [],
  },
  strong_topics: {
    type: [String],
    default: [],
  },
  topic_performance: {
    type: Map,
    of: Number,  // Topic name -> performance score (0-100)
    default: {},
  },
  last_updated: {
    type: Date,
    default: Date.now,
  },
});

// Index for quick retrieval by user
MLInsightSchema.index({ user_id: 1 });
MLInsightSchema.index({ last_updated: -1 });

const MLInsight = mongoose.model("MLInsight", MLInsightSchema);
export default MLInsight;

