import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const UserBadgeSchema = new mongoose.Schema({
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
  badge_id: {
    type: String,
    ref: "Badge",
    required: true,
  },
  achieved_at: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure a user doesn't get the same badge twice
UserBadgeSchema.index({ user_id: 1, badge_id: 1 }, { unique: true });
UserBadgeSchema.index({ achieved_at: -1 });

// Virtual for getting badge details
UserBadgeSchema.virtual('badge', {
  ref: 'Badge',
  localField: 'badge_id',
  foreignField: 'id',
  justOne: true
});

const UserBadge = mongoose.model("UserBadge", UserBadgeSchema);
export default UserBadge;

