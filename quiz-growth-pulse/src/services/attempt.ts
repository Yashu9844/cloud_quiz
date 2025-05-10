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

// Updated interface for the answer data needed when creating an attempt
export interface AttemptAnswer {
  question_id: string;
  selected_answer: string | string[];
  is_correct?: boolean; // Optional as this might be determined on the backend
}

export interface CreateAttemptRequest {
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  answers: AttemptAnswer[];
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
 * Create a new quiz attempt with full completion data
 * @param data All required quiz attempt data (quiz_id, score, total_questions, correct_answers, time_taken, answers)
 * @returns The created quiz attempt object
 */
export const createAttempt = async (data: CreateAttemptRequest): Promise<QuizAttempt> => {
  try {
    // Validate required fields
    if (!data.quiz_id) {
      throw new Error('Quiz ID is required');
    }
    
    if (!Array.isArray(data.answers) || data.answers.length === 0) {
      throw new Error('At least one answer is required');
    }
    
    if (typeof data.score !== 'number' || data.score < 0 || data.score > 100) {
      throw new Error('Score must be a number between 0 and 100');
    }
    
    if (typeof data.total_questions !== 'number' || data.total_questions <= 0) {
      throw new Error('Total questions must be a positive number');
    }
    
    if (typeof data.correct_answers !== 'number' || data.correct_answers < 0 || 
        data.correct_answers > data.total_questions) {
      throw new Error('Correct answers must be a number between 0 and total questions');
    }
    
    if (typeof data.time_taken !== 'number' || data.time_taken < 0) {
      throw new Error('Time taken must be a positive number');
    }
    
    // Get authentication token from local storage
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    console.log('Creating quiz attempt with data:', data);

    const response = await axios.post<CreateAttemptResponse>(
      `${API_BASE_URL}/quiz-attempts`, 
      data,
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
      } else if (error.response?.status === 500) {
        console.error('Server error details:', error.response.data);
        // Extract more useful error information if available
        const errorMessage = error.response.data?.message || 
          error.response.data?.error || 
          'Server error occurred';
        throw new Error(`Server error: ${errorMessage}`);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    
    throw new Error('Failed to create quiz attempt. Please try again later.');
  }
};

/**
 * Create a simple quiz attempt (used when starting a quiz, before completing it)
 * @param quizId The ID of the quiz to attempt
 * @returns The created quiz attempt object
 */
export const createInitialAttempt = async (quizId: string): Promise<QuizAttempt> => {
  try {
    // Get authentication token from local storage
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    // For initial attempts, we just need the quiz_id
    // The server will create an IN_PROGRESS attempt
    const response = await axios.post<CreateAttemptResponse>(
      `${API_BASE_URL}/quiz-attempts/initialize`, 
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
    console.error('Error creating initial quiz attempt:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        throw new Error('Quiz not found.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    
    throw new Error('Failed to start quiz attempt. Please try again later.');
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

