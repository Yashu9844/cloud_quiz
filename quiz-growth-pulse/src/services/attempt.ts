import axios from 'axios';

// API base URL from environment variable or fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Types for quiz attempts
export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  score: number | null;
  total_questions: number | null;
  correct_answers: number | null;
  time_taken: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface QuizAttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  question_order: number;
  selected_answer: string | string[];
  is_correct: boolean;
  created_at: string;
}

export interface CreateAttemptResponse {
  message: string;
  attempt: QuizAttempt;
}

export interface SubmitAnswerResponse {
  message: string;
  is_correct: boolean;
  answer: QuizAttemptAnswer;
}

/**
 * Create a new quiz attempt
 * @param quizId The ID of the quiz to attempt
 * @returns The created quiz attempt object
 */
export const createAttempt = async (quizId: string): Promise<QuizAttempt> => {
  try {
    // Get authentication token from local storage
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.post<CreateAttemptResponse>(
      `${API_BASE_URL}/quiz-attempts`, 
      { quiz_id: quizId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data.attempt;
  } catch (error) {
    console.error('Error creating quiz attempt:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        throw new Error('Quiz not found.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    
    throw new Error('Failed to create quiz attempt. Please try again later.');
  }
};

/**
 * Submit an answer for a specific question in a quiz attempt
 * @param attemptId The ID of the quiz attempt
 * @param questionId The ID of the question
 * @param selectedAnswer The answer(s) selected by the user
 * @param questionOrder Optional order of the question in the quiz
 * @returns Response with the submitted answer and correctness
 */
export const submitAnswer = async (
  attemptId: string, 
  questionId: string, 
  selectedAnswer: string | string[],
  questionOrder: number = 0
): Promise<SubmitAnswerResponse> => {
  try {
    // Get authentication token from local storage
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.post<SubmitAnswerResponse>(
      `${API_BASE_URL}/quiz-attempts/${attemptId}/answers`, 
      {
        question_id: questionId,
        selected_answer: selectedAnswer,
        question_order: questionOrder
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error submitting answer:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You are not authorized to submit answers for this attempt.');
      } else if (error.response?.status === 404) {
        throw new Error('Quiz attempt or question not found.');
      } else if (error.response?.status === 400 && error.response.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    
    throw new Error('Failed to submit answer. Please try again later.');
  }
};

