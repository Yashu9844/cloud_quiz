import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

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
  baseURL: import.meta.env.VITE_API_URL,
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
    const response = await api.get('/quiz');
    return response.data;
  },
  
  // Get quiz by ID
  getQuizById: async (id: string): Promise<Quiz> => {
    const response = await api.get(`/quiz/${id}`);
    return response.data;
  },
  
  // Get questions for a quiz
  getQuizQuestions: async (quizId: string): Promise<QuizApiResponse> => {
    const response = await api.get(`/question/quiz?quiz_id=${quizId}`);
    return response.data;
  },
  
  // Submit a quiz attempt
  submitQuizAttempt: async (attempt: QuizAttempt): Promise<any> => {
    const response = await api.post('/quiz-attempts/create', attempt);
    return response.data;
  }
};

// API methods for authentication
export const authApi = {
  // Login
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  // Register
  register: async (username: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  }
};

export default api;

