// Base API URL from environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Quiz-related endpoints
export const QUIZ_ENDPOINTS = {
  GET_ALL: '/quizzes',
  GET_BY_ID: (id: string) => `/quizzes/${id}`,
  GET_QUESTIONS: (id: string) => `/quizzes/${id}/questions`,
  SUBMIT_ATTEMPT: '/quiz-attempts',  // Changed from /quiz-attempts/create
  GET_USER_ATTEMPTS: '/quiz-attempts',  // Changed from /quiz-attempts/user
  GET_ATTEMPT_BY_ID: (id: string) => `/quiz-attempts/${id}`,
  SUBMIT_ANSWER: (attemptId: string) => `/quiz-attempts/${attemptId}/answers`,
  GET_POPULAR: '/quizzes/popular',
  GET_RECENT: '/quizzes/recent',
  SEARCH: '/quizzes/search',
};

// Auth-related endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  VERIFY_EMAIL: '/auth/verify-email',
  RESET_PASSWORD: '/auth/reset-password',
};

// Dashboard endpoints
export const DASHBOARD_ENDPOINTS = {
  GET_STATS: '/dashboard/stats',
  GET_PERFORMANCE: '/dashboard/performance',
  GET_RECENT_ACTIVITY: '/dashboard/activity',
};

// User endpoints
export const USER_ENDPOINTS = {
  GET_PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  CHANGE_PASSWORD: '/users/password',
};

