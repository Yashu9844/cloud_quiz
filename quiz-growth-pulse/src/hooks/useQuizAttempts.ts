import { useQuery } from '@tanstack/react-query';
import { getUserQuizAttempts, QuizAttempt } from '@/services/quiz';
import { useState, useMemo } from 'react';

export type SortOrder = 'asc' | 'desc';
export type SortField = 'date' | 'score' | 'title';
export type FilterOptions = {
  minScore?: number;
  maxScore?: number;
  category?: string;
};

interface UseQuizAttemptsOptions {
  initialSortField?: SortField;
  initialSortOrder?: SortOrder;
  initialFilters?: FilterOptions;
  enabled?: boolean;
}

/**
 * Custom hook for fetching and managing user quiz attempts
 * @param options Sorting, filtering, and query options
 * @returns Sorted and filtered quiz attempts with loading/error states and utility functions
 */
export const useQuizAttempts = (options: UseQuizAttemptsOptions = {}) => {
  // Destructure options with defaults
  const {
    initialSortField = 'date',
    initialSortOrder = 'desc',
    initialFilters = {},
    enabled = true
  } = options;

  // State for sorting and filtering
  const [sortField, setSortField] = useState<SortField>(initialSortField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  // Fetch quiz attempts using React Query
  const {
    data: attempts = [],
    isLoading,
    error,
    refetch,
    isError
  } = useQuery({
    queryKey: ['quizAttempts'],
    queryFn: getUserQuizAttempts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled
  });

  // Helper function to sort attempts
  const sortAttempts = (a: QuizAttempt, b: QuizAttempt) => {
    if (sortField === 'date') {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
    if (sortField === 'score') {
      return sortOrder === 'asc' ? a.score - b.score : b.score - a.score;
    }
    
    if (sortField === 'title') {
      const titleA = a.quiz_title || '';
      const titleB = b.quiz_title || '';
      return sortOrder === 'asc' 
        ? titleA.localeCompare(titleB) 
        : titleB.localeCompare(titleA);
    }
    
    return 0;
  };

  // Helper function to filter attempts
  const filterAttempts = (attempt: QuizAttempt) => {
    // Filter by min score
    if (filters.minScore !== undefined && attempt.score < filters.minScore) {
      return false;
    }
    
    // Filter by max score
    if (filters.maxScore !== undefined && attempt.score > filters.maxScore) {
      return false;
    }
    
    // Filter by category
    if (filters.category && attempt.quiz_title !== filters.category) {
      return false;
    }
    
    return true;
  };

  // Memoize the sorted and filtered attempts
  const sortedAndFilteredAttempts = useMemo(() => {
    return [...attempts]
      .filter(filterAttempts)
      .sort(sortAttempts);
  }, [attempts, sortField, sortOrder, filters]);

  // Utility functions for sorting
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const changeSortField = (field: SortField) => {
    if (field === sortField) {
      toggleSortOrder();
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending for new field
    }
  };

  // Update filters with new options
  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({});
  };

  // Group attempts by date (for timeline view)
  const attemptsByDate = useMemo(() => {
    const grouped: Record<string, QuizAttempt[]> = {};
    
    sortedAndFilteredAttempts.forEach(attempt => {
      const date = new Date(attempt.created_at).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(attempt);
    });
    
    return grouped;
  }, [sortedAndFilteredAttempts]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalCorrectAnswers: 0,
        totalQuestions: 0,
        successRate: 0
      };
    }
    
    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const averageScore = Math.round(totalScore / totalAttempts);
    const bestScore = Math.max(...attempts.map(attempt => attempt.score));
    const worstScore = Math.min(...attempts.map(attempt => attempt.score));
    const totalCorrectAnswers = attempts.reduce((sum, attempt) => sum + attempt.correct_answers, 0);
    const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.total_questions, 0);
    const successRate = totalQuestions > 0 
      ? Math.round((totalCorrectAnswers / totalQuestions) * 100) 
      : 0;
    
    return {
      totalAttempts,
      averageScore,
      bestScore,
      worstScore,
      totalCorrectAnswers,
      totalQuestions,
      successRate
    };
  }, [attempts]);

  // Get the most recent attempt
  const latestAttempt = useMemo(() => {
    if (attempts.length === 0) return null;
    
    return attempts.reduce((latest, current) => {
      const latestDate = new Date(latest.created_at).getTime();
      const currentDate = new Date(current.created_at).getTime();
      return currentDate > latestDate ? current : latest;
    }, attempts[0]);
  }, [attempts]);

  // Error message handling
  const errorMessage = useMemo(() => {
    if (!isError) return null;
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An error occurred while fetching quiz attempts';
  }, [error, isError]);

  return {
    // Data
    attempts: sortedAndFilteredAttempts,
    attemptsByDate,
    latestAttempt,
    stats,
    
    // Sorting
    sortField,
    sortOrder,
    changeSortField,
    toggleSortOrder,
    
    // Filtering
    filters,
    updateFilters,
    resetFilters,
    
    // Loading and error states
    isLoading,
    isError,
    error,
    errorMessage,
    
    // Refetch
    refetch
  };
};

export default useQuizAttempts;

