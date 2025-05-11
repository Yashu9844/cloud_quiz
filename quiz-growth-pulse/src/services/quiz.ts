import api from './api';
import { QUIZ_ENDPOINTS } from '../constants/endpoints';

// Quiz category interface
export interface QuizCategory {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

// Quiz interface
export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit: number; // in minutes
  question_count: number;
  created_at: string;
  image_url?: string;
  tags?: string[];
  avg_score?: number;
  popularity?: number;
}

// Question interface
export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'matching';
  options: any[];
  correct_answer: any;
  explanation?: string;
  difficulty: number; // 1-10 scale
  points: number;
  media_url?: string;
}

// Quiz attempt interface
export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number; // in seconds
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  created_at: string;
  completed_at?: string;
  quiz_title?: string; // Sometimes included by the backend
}

// Quiz answer interface
export interface QuizAnswer {
  question_id: string;
  selected_answer: any;
}

// Quiz submission interface
export interface QuizSubmission {
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  answers: QuizAnswer[];
}

/**
 * Fetches all available quizzes
 */
export const getQuizzes = async (): Promise<Quiz[]> => {
  try {
    const response = await api.get(QUIZ_ENDPOINTS.GET_ALL);
    return response.data;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
};

/**
 * Fetches a specific quiz by ID
 */
export const getQuizById = async (quizId: string): Promise<Quiz> => {
  try {
    const response = await api.get(QUIZ_ENDPOINTS.GET_BY_ID(quizId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching quiz ${quizId}:`, error);
    throw error;
  }
};

/**
 * Fetches questions for a specific quiz
 */
export const getQuizQuestions = async (quizId: string): Promise<Question[]> => {
  try {
    const response = await api.get(QUIZ_ENDPOINTS.GET_QUESTIONS(quizId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching questions for quiz ${quizId}:`, error);
    throw error;
  }
};

/**
 * Submits a completed quiz
 */
export const submitQuiz = async (submission: QuizSubmission): Promise<QuizAttempt> => {
  try {
    const response = await api.post(QUIZ_ENDPOINTS.SUBMIT_ATTEMPT, submission);
    return response.data;
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
};

/**
 * Fetches all quiz attempts for the current user
 */
export const getUserQuizAttempts = async (): Promise<QuizAttempt[]> => {
  try {
    const response = await api.get(QUIZ_ENDPOINTS.GET_USER_ATTEMPTS);
    return response.data;
  } catch (error) {
    console.error('Error fetching user quiz attempts:', error);
    throw error;
  }
};

/**
 * Fetches a specific quiz attempt by ID
 */
export const getQuizAttemptById = async (attemptId: string): Promise<QuizAttempt> => {
  try {
    const response = await api.get(QUIZ_ENDPOINTS.GET_ATTEMPT_BY_ID(attemptId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching quiz attempt ${attemptId}:`, error);
    throw error;
  }
};

/**
 * Fetches popular quizzes
 */
export const getPopularQuizzes = async (limit = 5): Promise<Quiz[]> => {
  try {
    const response = await api.get(QUIZ_ENDPOINTS.GET_POPULAR, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching popular quizzes:', error);
    throw error;
  }
};

/**
 * Fetches recent quizzes
 */
export const getRecentQuizzes = async (limit = 5): Promise<Quiz[]> => {
  try {
    const response = await api.get(QUIZ_ENDPOINTS.GET_RECENT, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent quizzes:', error);
    throw error;
  }
};

/**
 * Searches for quizzes by query
 */
export const searchQuizzes = async (query: string): Promise<Quiz[]> => {
  try {
    const response = await api.get(QUIZ_ENDPOINTS.SEARCH, {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error(`Error searching quizzes with query "${query}":`, error);
    throw error;
  }
};

export default {
  getQuizzes,
  getQuizById,
  getQuizQuestions,
  submitQuiz,
  getUserQuizAttempts,
  getQuizAttemptById,
  getPopularQuizzes,
  getRecentQuizzes,
  searchQuizzes
};

