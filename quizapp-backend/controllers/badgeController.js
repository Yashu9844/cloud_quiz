import Badge from "../models/Badge.js";
import { v4 as uuidv4 } from "uuid";

// Create a badge
export const createBadge = async (req, res) => {
  try {
    const { name, description, min_score_threshold } = req.body;

    const newBadge = await Badge.create({
      id: uuidv4(),
      name,
      description,
      min_score_threshold,
    });

    res.status(201).json({ message: "Badge created successfully", badge: newBadge });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Error creating badge" });
  }
};

// Get all badges
export const getBadges = async (req, res) => {
  try {
    const badges = await Badge.find({});
    res.status(200).json(badges);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching badges" });
  }
};

// Delete a badge
export const deleteBadge = async (req, res) => {
  try {
    const { id } = req.params;

    const badge = await Badge.findOne({ id });
    if (!badge) {
      return res.status(404).json({ message: "Badge not found" });
    }

    await Badge.deleteOne({ id });

    res.status(200).json({ message: "Badge deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting badge" });
  }
};
