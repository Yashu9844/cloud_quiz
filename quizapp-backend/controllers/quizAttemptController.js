import QuizAttempt from "../models/QuizAttempt.js";
import QuizAttemptAnswer from "../models/QuizAttemptAnswer.js";
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";
import { v4 as uuidv4 } from "uuid";

// Create a new quiz attempt
export const createQuizAttempt = async (req, res) => {
  try {
    const { quiz_id, score, total_questions, correct_answers, time_taken, answers } = req.body;
    const user_id = req.user.id;

    // Check if quiz exists
    const quiz = await Quiz.findOne({_id: quiz_id });
    console.log(quiz_id, )
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Create the quiz attempt
    const newAttempt = await QuizAttempt.create({
      id: uuidv4(),
      user_id,
      quiz_id,
      score,
      total_questions,
      correct_answers,
      time_taken,
    });

    // Create attempt answers
    const attemptAnswers = await Promise.all(
      answers.map(async (answer) => {
     const question =   await Question.findOne({ _id: answer.question_id })
        if (!question) {
          throw new Error(`Question not found for id: ${answer.question_id}`);
        }

        const is_correct = JSON.stringify(answer.selected_answer) === JSON.stringify(question.correct_answer);

        return {
          id: uuidv4(),
          attempt_id: newAttempt.id,
          question_id: answer.question_id,
          selected_answer: answer.selected_answer,
          is_correct,
        };
      })
    );

    await QuizAttemptAnswer.insertMany(attemptAnswers);

    res.status(201).json({ message: "Quiz attempt created successfully", attempt: newAttempt });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Error creating quiz attempt" });
  }
};

// Get all quiz attempts for a user
export const getUserQuizAttempts = async (req, res) => {
  try {
    const user_id = req.user.id;
    const attempts = await QuizAttempt.find({ user_id }).populate("quiz_id");
    res.status(200).json(attempts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching quiz attempts" });
  }
};

// Get a single quiz attempt by ID
export const getQuizAttemptById = async (req, res) => {
  try {
    const { id } = req.params;

    const attempt = await QuizAttempt.findOne({ id })
      .populate("quiz_id");

    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    if (attempt.user_id !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Fetch related answers separately
    const answers = await QuizAttemptAnswer.find({ attempt_id: id }).populate("question_id");

    res.status(200).json({ ...attempt.toObject(), answers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching quiz attempt" });
  }
};

// Delete a quiz attempt
export const deleteQuizAttempt = async (req, res) => {
  try {
    const { id } = req.params;

    const attempt = await QuizAttempt.findOne({ id });
    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    if (attempt.user_id !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await QuizAttempt.deleteOne({ id });
    await QuizAttemptAnswer.deleteMany({ attempt_id: id });

    res.status(200).json({ message: "Quiz attempt deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting quiz attempt" });
  }
};
