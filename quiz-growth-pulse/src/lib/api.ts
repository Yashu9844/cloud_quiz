import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, QUIZ_ENDPOINTS, AUTH_ENDPOINTS } from '../constants/endpoints';

// Types for API responses
export interface Quiz {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  content: string;
  question_type: 'MCQ' | 'MULTI_SELECT';
  options: string[];
  correct_answer: string[];
  created_at: string;
  _id?: string; // MongoDB ID field
}

export interface QuizApiResponse {
  questions: QuizQuestion[];
  time_limit?: number;
}

export interface QuizAttempt {
  quiz_id: string;
  user_id?: string; // Will be extracted from auth token on server side if not provided
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
}

export interface QuizAttemptDetails extends QuizAttempt {
  id: string;
  created_at: string;
  quiz?: Quiz;
  correct_percentage?: number;
}

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
  answer: {
    id: string;
    attempt_id: string;
    question_id: string;
    question_order: number;
    selected_answer: string | string[];
    is_correct: boolean;
    created_at: string;
  };
}

export interface ApiError {
  message: string;
  status?: number;
}

// User type for auth responses
export interface User {
  id: string;
  username: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

// Authentication response
export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

// Create a base axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Create a standardized error object
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status
    };

    // Handle specific error cases
    if (error.response) {
      // Server returned an error response
      const data = error.response.data as any;
      apiError.message = data.message || data.error || `Error: ${error.response.status}`;
      
      // Handle authentication errors
      if (error.response.status === 401) {
        // Optionally clear token and redirect to login
        console.error('Authentication error:', apiError.message);
      }
    } else if (error.request) {
      // Request made but no response received
      apiError.message = 'No response from server. Please check your connection.';
    }

    return Promise.reject(apiError);
  }
);

// API methods for quizzes
export const quizApi = {
  // Get all quizzes
  getQuizzes: async (): Promise<Quiz[]> => {
    const response = await api.get(QUIZ_ENDPOINTS.GET_ALL);
    return response.data;
  },
  
  // Get quiz by ID
  getQuizById: async (id: string): Promise<Quiz> => {
    const response = await api.get(QUIZ_ENDPOINTS.GET_BY_ID(id));
    return response.data;
  },
  
  // Get questions for a quiz
  getQuizQuestions: async (quizId: string): Promise<QuizApiResponse> => {
    const response = await api.get(QUIZ_ENDPOINTS.GET_QUESTIONS(quizId));
    return response.data;
  },
  
  // Submit a quiz attempt
  submitQuizAttempt: async (attempt: CreateAttemptRequest): Promise<QuizAttempt> => {
    const response = await api.post(QUIZ_ENDPOINTS.SUBMIT_ATTEMPT, attempt);
    return response.data.attempt;
  },

  // Create initial attempt
  createInitialAttempt: async (quizId: string): Promise<QuizAttempt> => {
    const response = await api.post('/quiz-attempts/initialize', { quiz_id: quizId });
    return response.data.attempt;
  },

  // Submit answer
  submitAnswer: async (
    attemptId: string,
    questionId: string,
    selectedAnswer: string | string[],
    questionOrder: number = 0
  ): Promise<SubmitAnswerResponse> => {
    const response = await api.post(`/quiz-attempts/${attemptId}/answers`, {
      question_id: questionId,
      selected_answer: selectedAnswer,
      question_order: questionOrder
    });
    return response.data;
  },

  // Get all attempts for the current user
  getUserAttempts: async (): Promise<QuizAttemptDetails[]> => {
    try {
      const response = await api.get(QUIZ_ENDPOINTS.GET_USER_ATTEMPTS);
      return response.data;
    } catch (error) {
      console.error('Error fetching user attempts:', error);
      return [];
    }
  },

  // Get a specific attempt by ID
  getAttemptById: async (id: string): Promise<QuizAttemptDetails | null> => {
    try {
      const response = await api.get(QUIZ_ENDPOINTS.GET_ATTEMPT_BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Error fetching attempt ${id}:`, error);
      return null;
    }
  }
};

// API methods for authentication
export const authApi = {
  // Login
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post(AUTH_ENDPOINTS.LOGIN, { email, password });
    return response.data;
  },
  
  // Register
  register: async (username: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post(AUTH_ENDPOINTS.REGISTER, { username, email, password });
    return response.data;
  }
};

export default api;

