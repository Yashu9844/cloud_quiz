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

// Submit an answer for a quiz attempt
export const submitQuizAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { question_id, selected_answer, question_order } = req.body;
    const user_id = req.user.id;

    // Find the attempt
    const attempt = await QuizAttempt.findOne({ id: attemptId });
    
    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    // Verify the user owns this attempt
    if (attempt.user_id !== user_id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Verify the attempt is still in progress
    if (attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({ message: "This quiz attempt is already completed or abandoned" });
    }

    // Find the question
    const question = await Question.findOne({ id: question_id });
    
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Check if this question belongs to the quiz being attempted
    if (question.quiz_id !== attempt.quiz_id) {
      return res.status(400).json({ message: "This question does not belong to the attempted quiz" });
    }

    // Check if an answer for this question already exists
    const existingAnswer = await QuizAttemptAnswer.findOne({ 
      attempt_id: attemptId,
      question_id: question_id
    });

    if (existingAnswer) {
      return res.status(400).json({ message: "Answer for this question already submitted" });
    }

    // Determine if the answer is correct
    const is_correct = JSON.stringify(selected_answer) === JSON.stringify(question.correct_answer);

    // Create new answer
    const newAnswer = await QuizAttemptAnswer.create({
      id: uuidv4(),
      attempt_id: attemptId,
      question_id: question_id,
      selected_answer,
      is_correct,
      question_order: question_order || 0
    });

    // Update the attempt status if this was the last question
    const answersCount = await QuizAttemptAnswer.countDocuments({ attempt_id: attemptId });
    const questionsCount = await Question.countDocuments({ quiz_id: attempt.quiz_id });
    
    if (answersCount === questionsCount) {
      // Calculate the final score
      const correctAnswers = await QuizAttemptAnswer.countDocuments({ 
        attempt_id: attemptId,
        is_correct: true
      });
      
      // Update attempt with completion details
      await QuizAttempt.updateOne(
        { id: attemptId },
        { 
          status: "COMPLETED",
          completed_at: new Date(),
          score: (correctAnswers / questionsCount) * 100,
          total_questions: questionsCount,
          correct_answers: correctAnswers
        }
      );
    }

    res.status(201).json({ 
      message: "Answer submitted successfully", 
      is_correct,
      answer: newAnswer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Error submitting answer" });
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
