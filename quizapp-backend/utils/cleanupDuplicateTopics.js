import Quiz from "../models/Quiz.js";
import Question from "../models/Question.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Utility script to identify and clean up duplicate topics
 * - Identifies quizzes with the same topic (case-insensitive)
 * - Keeps the oldest quiz with questions 
 * - Removes duplicates without questions
 */
const cleanupDuplicateTopics = async () => {
  try {

