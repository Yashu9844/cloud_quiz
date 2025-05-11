import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { showToast } from '../components/ui/toast';

// Base URL configuration - adjust based on environment
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create an Axios instance with default configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Request interceptor for API calls
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add auth token to headers if available
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response) {
      // Server returned an error response (4xx, 5xx)
      const status = error.response.status;
      
      if (status === 401) {
        // Handle unauthorized access
        errorMessage = 'Your session has expired. Please sign in again.';
        // Clear auth token and redirect to login
        localStorage.removeItem('authToken');
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      } else if (status === 403) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (status === 404) {
        errorMessage = 'The requested resource was not found';
      } else if (status === 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (error.response.data?.message) {
        // Use server-provided error message if available
        errorMessage = error.response.data.message;
      }
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'No response from server. Please check your connection';
    } else if (error.message) {
      // Something else happened in making the request
      errorMessage = error.message;
    }

    // Show toast notification for errors (except 401 in certain cases)
    if (!(error.response?.status === 401 && window.location.pathname.includes('/login'))) {
      showToast({
        message: errorMessage,
        type: 'error',
        duration: 5000,
      });
    }

    return Promise.reject(error);
  }
);

export default api;

