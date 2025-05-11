import { quizApi, QuizAttempt, QuizAttemptDetails, CreateAttemptRequest, SubmitAnswerResponse } from '../lib/api';

/**
 * Get all quiz attempts for the current user
 */
export const getUserAttempts = async (): Promise<QuizAttemptDetails[]> => {
  try {
    return await quizApi.getUserAttempts();
  } catch (error) {
    console.error('Error fetching user attempts:', error);
    return [];
  }
};

/**
 * Get a specific quiz attempt by ID
 */
export const getAttemptById = async (id: string): Promise<QuizAttemptDetails | null> => {
  try {
    return await quizApi.getAttemptById(id);
  } catch (error) {
    console.error(`Error fetching attempt ${id}:`, error);
    return null;
  }
};

/**
 * Submit a completed quiz attempt
 */
export const submitQuizAttempt = async (attempt: CreateAttemptRequest): Promise<QuizAttempt> => {
  try {
    const result = await quizApi.submitQuizAttempt(attempt);
    // After successful submission, fetch the complete attempt details
    if (result && 'id' in result) {
      const fullAttempt = await quizApi.getAttemptById((result as { id: string }).id);
      if (!fullAttempt) {
        throw new Error('Failed to fetch completed attempt details');
      }
      return fullAttempt;
    }
    return result;
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    throw error;
  }
};

/**
 * Create an initial quiz attempt
 */
export const createInitialAttempt = async (quizId: string): Promise<QuizAttempt> => {
  try {
    return await quizApi.createInitialAttempt(quizId);
  } catch (error) {
    console.error('Error creating initial quiz attempt:', error);
    throw error;
  }
};

/**
 * Submit an answer for a quiz question
 */
export const submitAnswer = async (
  attemptId: string,
  questionId: string,
  selectedAnswer: string | string[],
  questionOrder: number = 0
): Promise<SubmitAnswerResponse> => {
  try {
    return await quizApi.submitAnswer(attemptId, questionId, selectedAnswer, questionOrder);
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
};

