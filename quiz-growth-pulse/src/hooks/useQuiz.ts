import { useQuery } from '@tanstack/react-query';
import { getUserQuizAttempts, getQuizAttemptById } from '../services/quiz';

/**
 * Hook for fetching all quiz attempts for the current user
 */
export const useQuizAttempts = () => {
  return useQuery({
    queryKey: ['quizAttempts'],
    queryFn: getUserQuizAttempts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
  });
};

/**
 * Hook for fetching a specific quiz attempt by ID
 */
export const useQuizAttempt = (id: string) => {
  return useQuery({
    queryKey: ['quizAttempt', id],
    queryFn: () => getQuizAttemptById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

