import express from "express";
import { createBadge, getBadges, deleteBadge } from "../controllers/badgeController.js";

const router = express.Router();

router.post("/", createBadge); // POST /api/badges
router.get("/", getBadges);     // GET /api/badges
router.delete("/:id", deleteBadge); // DELETE /api/badges/:id

export default router;
