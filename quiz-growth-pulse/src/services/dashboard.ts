import axios from 'axios';

// API base URL from environment variable or fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Types for dashboard data
export interface PerformanceHistoryItem {
  id: string;
  quiz_id: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  date: string;
}

export interface BadgeAchievement {
  id: string;
  badge_id: string;
  name: string;
  description: string;
  achieved_at: string;
}

export interface TopicProficiency {
  [topic: string]: number;
}

export interface DashboardData {
  weak_topics: string[];
  strong_topics: string[];
  topic_proficiency: TopicProficiency;
  performance_history: PerformanceHistoryItem[];
  badges: BadgeAchievement[];
  insight_last_updated: string | null;
}

/**
 * Fetch dashboard data for a specific user
 * @param userId The user ID
 * @returns Dashboard data including performance, weak/strong topics, and badges
 */
export const fetchDashboardData = async (userId: string): Promise<DashboardData> => {
  try {
    // Get authentication token from local storage
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.get(`${API_BASE_URL}/dashboard/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You are not authorized to access this dashboard.');
      } else if (error.response?.status === 404) {
        throw new Error('Dashboard data not found.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    
    throw new Error('Failed to fetch dashboard data. Please try again later.');
  }
};

