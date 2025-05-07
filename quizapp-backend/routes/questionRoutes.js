import express from "express";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuizQuestions,
} from "../controllers/questionController.js"

const router = express.Router();

// Create a new question
router.post("/create", authenticateUser, createQuestion);

// Get all questions
router.get("/", authenticateUser, getAllQuestions);

// Get questions for a quiz (with limit)
router.get("/quiz", authenticateUser, getQuizQuestions);

// Get a question by ID
router.get("/:id", authenticateUser, getQuestionById);

// Update a question by ID
router.put("/:id", authenticateUser, updateQuestion);

// Delete a question by ID
router.delete("/:id", authenticateUser, deleteQuestion);

export default router;
