import QuizAttempt from "../models/QuizAttempt.js";
import QuizAttemptAnswer from "../models/QuizAttemptAnswer.js";
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";
import { v4 as uuidv4 } from "uuid";
import { generateUserInsights } from "../utils/mlInsightGenerator.js";

// Create a new quiz attempt
export const createQuizAttempt = async (req, res) => {
  try {
    const { quiz_id, score, total_questions, correct_answers, time_taken, answers } = req.body;
    const user_id = req.user.id;
    
    // Validate quiz_id basic format
    if (!quiz_id || typeof quiz_id !== 'string' || quiz_id.trim() === '') {
      console.error("Invalid quiz_id format:", quiz_id);
      return res.status(400).json({ 
        message: "Invalid quiz ID format",
        details: "Quiz ID cannot be empty" 
      });
    }
    
    // Validate UUID format
    if (!isValidUUID(quiz_id)) {
      console.error("Invalid UUID format for quiz_id:", quiz_id);
      return res.status(400).json({ 
        message: "Invalid quiz ID format",
        details: "Quiz ID must be a valid UUID"
      });
    }
    
    console.log("Attempting to create quiz attempt for quiz:", quiz_id);
    
    // Check if quiz exists with detailed logging
    const quiz = await Quiz.findOne({ id: quiz_id });
    console.log("Quiz lookup result:", quiz ? "Found" : "Not found");
    
    if (!quiz) {
      console.error("Quiz lookup failed. Details:", {
        quiz_id,
        lookup_time: new Date().toISOString(),
        error: "Quiz not found"
      });
      return res.status(404).json({
        message: "Quiz not found",
        details: `No quiz found with ID: ${quiz_id}`
      });
    }
    
    // Begin a MongoDB session for transaction
    const session = await QuizAttempt.startSession();
    
    let newAttempt;
    let attemptAnswers = [];
    
    try {
      // Start transaction
      await session.withTransaction(async () => {
        // Create the quiz attempt
        newAttempt = await QuizAttempt.create([{
          id: uuidv4(),
          user_id,
          quiz_id,
          score,
          total_questions,
          correct_answers,
          time_taken,
          status: "COMPLETED", // Mark attempt as completed since all answers are submitted at once
          completed_at: new Date(), // Set completion timestamp
        }], { session });
        
        newAttempt = newAttempt[0]; // Extract from array returned by create
        
        // Prepare attempt answers
        const answerPromises = answers.map(async (answer) => {
        // Validate question_id format
        if (!answer.question_id || typeof answer.question_id !== 'string') {
          throw new Error(`Invalid question ID format: ${answer.question_id}`);
        }
        
        console.log(`Looking up question with ID: ${answer.question_id}`);
        const question = await Question.findOne({ id: answer.question_id });
        
        if (!question) {
          console.error(`Question not found with ID: ${answer.question_id}`);
          throw new Error(`Question not found for id: ${answer.question_id}`);
        }
        
        // Verify the question belongs to the correct quiz
        if (question.quiz_id !== quiz_id) {
          console.error(`Question ${answer.question_id} belongs to quiz ${question.quiz_id}, not ${quiz_id}`);
          throw new Error(`Question ${answer.question_id} does not belong to the specified quiz`);
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
        
        // Wait for all answer validations and preparations
        attemptAnswers = await Promise.all(answerPromises);
        
        // Insert all answers in the transaction
        await QuizAttemptAnswer.insertMany(attemptAnswers, { session });
      });
      
      // Transaction successful
      console.log("Quiz attempt created successfully:", {
        attempt_id: newAttempt.id,
        user_id,
        quiz_id,
        answer_count: attemptAnswers.length,
        timestamp: new Date().toISOString()
      });
      
      // Generate ML insights asynchronously
      try {
        // Run insight generation in the background without waiting for it to complete
        generateUserInsights(user_id)
          .then(insights => {
            console.log(`ML insights generated successfully for user ${user_id}`);
          })
          .catch(insightError => {
            console.error(`Error generating ML insights for user ${user_id}:`, insightError);
          });
      } catch (insightError) {
        // Log error but don't fail the main operation
        console.error(`Error initiating ML insight generation for user ${user_id}:`, insightError);
      }
      
      // Send success response
      res.status(201).json({ 
        message: "Quiz attempt created successfully", 
        attempt: newAttempt 
      });
      
    } catch (transactionError) {
      console.error("Transaction error during quiz attempt creation:", transactionError);
      throw transactionError; // Re-throw to be caught by the outer try-catch
    } finally {
      // End the session
      session.endSession();
    }
  } catch (error) {
    console.error("Error creating quiz attempt:", error);
    console.error("Error details:", {
      user_id: req.user?.id,
      quiz_id: req.body?.quiz_id,
      timestamp: new Date().toISOString(),
      error_message: error.message,
      error_stack: error.stack
    });
    res.status(500).json({ 
      message: error.message || "Error creating quiz attempt",
      error_type: error.name || "UnknownError"
    });
  }
};

// Helper function to validate UUID format
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Submit an answer for a quiz attempt
export const submitQuizAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { question_id, selected_answer, question_order } = req.body;
    const user_id = req.user.id;
    
    // Validate IDs
    if (!isValidUUID(attemptId)) {
      return res.status(400).json({ message: "Invalid attempt ID format" });
    }
    
    if (!question_id || typeof question_id !== 'string') {
      return res.status(400).json({ message: "Invalid question ID format" });
    }

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
      
      // Generate ML insights asynchronously when quiz is completed
      try {
        // Run insight generation in the background
        // We're not using await here intentionally to avoid delaying the response
        generateUserInsights(user_id)
          .then(insights => {
            console.log(`ML insights generated successfully for user ${user_id}`);
          })
          .catch(insightError => {
            console.error(`Error generating ML insights for user ${user_id}:`, insightError);
          });
      } catch (insightError) {
        // Log error but don't fail the main operation
        console.error(`Error initiating ML insight generation for user ${user_id}:`, insightError);
      }
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
    // Don't try to use populate with string IDs, fetch manually if needed
    const attempts = await QuizAttempt.find({ user_id });
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

    const attempt = await QuizAttempt.findOne({ id });

    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    if (attempt.user_id !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Fetch related answers separately
    const answers = await QuizAttemptAnswer.find({ attempt_id: id });
    
    // If needed, fetch the question details manually
    const questionIds = answers.map(answer => answer.question_id);
    const questions = await Question.find({ id: { $in: questionIds } });
    
    // Create a map for easy question lookup
    const questionMap = {};
    questions.forEach(q => questionMap[q.id] = q);
    
    // Add question details to each answer
    const answersWithQuestions = answers.map(answer => {
      const answerObj = answer.toObject();
      answerObj.question = questionMap[answer.question_id];
      return answerObj;
    });

    res.status(200).json({ ...attempt.toObject(), answers: answersWithQuestions });
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
