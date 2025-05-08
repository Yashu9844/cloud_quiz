import express from "express";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import { getDashboardData } from "../controllers/dashboardController.js";

const router = express.Router();

// GET dashboard data for a specific user
router.get("/:userId", authenticateUser, getDashboardData);

export default router;

