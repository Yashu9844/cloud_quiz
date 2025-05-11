import React, { useState, useEffect, useMemo, useCallback, ErrorInfo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FileText, Clock, PlusCircle, ChevronLeft, RefreshCw, AlertCircle, Loader2,
  ArrowUpDown, Calendar, TrendingUp, Filter
} from "lucide-react";
import ResultPage from "../components/ResultPage";
import QuizAttemptHistory from "../components/QuizAttemptHistory";
import { QuizAttempt } from "../services/quiz";
import { useQuizAttempts } from "../hooks/useQuizAttempts";
import { useQuizAttempt } from "../hooks/useQuiz";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

// Define the shape of the state passed through navigation
interface ResultsLocationState {
  score: number;
  totalQuestions: number;
  timeTaken: number;
  categoryId?: string;
  categoryName?: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
};

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // State for component errors
  const [componentError, setComponentError] = useState<{ hasError: boolean; message: string }>({
    hasError: false,
    message: "",
  });
  
  // Extract quiz results from location state or use defaults
  const state = location.state as ResultsLocationState | null;
  
  // Get attempt ID from URL parameters
  const { id: attemptId } = useParams<{ id?: string }>();
  
  // Get view mode from URL query params
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  
  // Use our custom hook for quiz attempts with sorting and filtering
  const { 
    attempts,
    attemptsByDate,
    stats,
    isLoading,
    errorMessage,
    isError,
    sortField,
    sortOrder,
    changeSortField,
    toggleSortOrder,
    filters,
    updateFilters,
    resetFilters
  } = useQuizAttempts({
    initialSortField: 'date',
    initialSortOrder: 'desc'
  });
  
  // Fetch specific attempt if ID is provided
  const {
    data: specificAttempt,
    isLoading: isLoadingSpecificAttempt,
  } = useQuizAttempt(attemptId || '');
  
  // Set lastResultsCheck timestamp when viewing results
  useEffect(() => {
    localStorage.setItem('lastResultsCheck', new Date().toISOString());
  }, []);
  
  // Error boundary handler
  class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      console.error("Results page error:", error, errorInfo);
      setComponentError({ 
        hasError: true, 
        message: error.message || "An unexpected error occurred" 
      });
    }

    render() {
      if (this.state.hasError) {
        return null; // The parent component will handle the error display
      }
      return this.props.children;
    }
  }
  
  // Toggle view mode between grid and timeline
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'timeline' : 'grid');
  };
  
  // Apply score filters
  const applyScoreFilter = (min?: number, max?: number) => {
    updateFilters({ minScore: min, maxScore: max });
  };
  
  // If component has an error, show error view
  if (componentError.hasError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 my-6">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-red-800 dark:text-red-400 font-semibold text-lg mb-2">An Error Occurred</h3>
                <p className="text-red-700 dark:text-red-300">{componentError.message}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no state was passed, show all attempts view
  if (!state) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-7xl mx-auto"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center mr-4 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  <span>Back to Dashboard</span>
                </button>
              </div>
              
              <button 
                onClick={() => navigate("/quiz")}
                className="flex items-center bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                <span>Take New Quiz</span>
              </button>
            </div>
            
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <FileText className="h-8 w-8 mr-3 text-primary" />
              Quiz Results History
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              View all your past quiz attempts and performance
            </p>
          </motion.div>
          
          {/* Stats summary card */}
          <motion.div variants={itemVariants} className="mb-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Quiz History Summary</CardTitle>
                <CardDescription>Your quiz performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Attempts</p>
                    <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg. Score</p>
                    <p className="text-2xl font-bold">{stats.averageScore}%</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Best Score</p>
                    <p className="text-2xl font-bold">{stats.bestScore}%</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Success Rate</p>
                    <p className="text-2xl font-bold">{stats.successRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Filters and controls */}
          <motion.div variants={itemVariants} className="mb-6 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2">
              <button 
                onClick={() => changeSortField('date')}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                  sortField === 'date' ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Date
                {sortField === 'date' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              
              <button 
                onClick={() => changeSortField('score')}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                  sortField === 'score' ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Score
                {sortField === 'score' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              
              <button 
                onClick={() => resetFilters()}
                className="px-3 py-1.5 rounded-md text-sm flex items-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Filter className="h-4 w-4 mr-1" />
                Clear Filters
              </button>
            </div>
            
            <div>
              <button 
                onClick={toggleViewMode}
                className="px-3 py-1.5 rounded-md text-sm flex items-center bg-primary/10 text-primary"
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
                {viewMode === 'grid' ? 'Timeline View' : 'Grid View'}
              </button>
            </div>
          </motion.div>
          
          {/* Quiz attempt history */}
          <QuizAttemptHistory 
            attempts={attempts}
            attemptsByDate={attemptsByDate}
            viewMode={viewMode}
            loading={isLoading}
            error={errorMessage}
          />
        </motion.div>
      </div>
    );
  }
  
  // If we're expecting state but it's missing, show a redirect option
  if (!state && location.pathname.includes('/results/')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-8 my-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-amber-800 dark:text-amber-400 font-semibold text-xl mb-2">Quiz Result Not Found</h3>
            <p className="text-amber-700 dark:text-amber-300 mb-4">
              The quiz result you're looking for is not available. This might happen if you refreshed the page or accessed it directly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <button 
                onClick={() => navigate('/results')}
                className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
              >
                View All Results
              </button>
              <button 
                onClick={() => navigate('/quiz')}
                className="border border-primary text-primary py-2 px-4 rounded-lg hover:bg-primary/10 transition-colors"
              >
                Take a New Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Now we can safely destructure state
  const { score, totalQuestions, timeTaken, categoryId, categoryName } = state as ResultsLocationState;
  
  // Handle retry - go back to quiz with same category if available
  const handleRetry = () => {
    if (categoryId) {
      navigate("/quiz", { state: { selectedCategory: categoryId } });
    } else {
      navigate("/quiz");
    }
  };
  
  // Handle review - go back to quiz selection
  const handleReview = () => {
    navigate("/quiz");
  };
  
  // Handle view all results
  const handleViewAllResults = () => {
    navigate("/results", { replace: true });
  };
  
  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-7xl mx-auto"
        >
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button 
                onClick={() => navigate("/dashboard")}
                className="flex items-center mr-4 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                <span>Back to Dashboard</span>
              </button>
            </div>
            
            <button 
              onClick={handleViewAllResults}
              className="flex items-center text-primary border border-primary py-2 px-4 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <FileText className="h-5 w-5 mr-2" />
              <span>View All Results</span>
            </button>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <FileText className="h-8 w-8 mr-3 text-primary" />
            Quiz Result
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {categoryName ? `${categoryName} - ` : ''}
            Completed {new Date().toLocaleDateString()}
          </p>
        </motion.div>
        
        {/* Current Result Display */}
        <motion.div variants={itemVariants}>
          <ResultPage
            score={score}
            totalQuestions={totalQuestions}
            timeTaken={timeTaken}
            onRetry={handleRetry}
            onReview={handleReview}
          />
        </motion.div>
        
        {/* Loading indicator while fetching attempts */}
        {isLoading && (
          <motion.div 
            variants={itemVariants}
            className="mt-12 flex justify-center items-center py-8"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <span className="text-gray-600 dark:text-gray-300">Loading your quiz history...</span>
          </motion.div>
        )}
        
        {/* Show recent attempts if available */}
        {!isLoading && attempts.length > 0 && (
          <motion.div 
            variants={itemVariants}
            className="mt-12"
          >
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mb-6">
              <h2 className="text-2xl font-bold mb-4">Recent Attempts</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your most recent quiz attempts
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attempts.slice(0, 3).map((attempt) => (
                <motion.div 
                  key={attempt.id}
                  className="animate-fade-in" 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Card className="h-full hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">
                          {attempt.quiz_title || `Quiz Attempt`}
                        </CardTitle>
                        <div className="bg-primary/10 text-primary font-bold py-1 px-3 rounded-full text-sm">
                          {attempt.score}%
                        </div>
                      </div>
                      <CardDescription className="mt-1">
                        {new Date(attempt.created_at).toLocaleDateString()} at {new Date(attempt.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            Correct answers:
                          </span>
                          <span className="font-medium">
                            {attempt.correct_answers} / {attempt.total_questions}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            Time taken:
                          </span>
                          <span className="font-medium">
                            {Math.floor(attempt.time_taken / 60)}m {attempt.time_taken % 60}s
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-3">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${attempt.score}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button 
                onClick={handleViewAllResults}
                className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
              >
                View all attempts
                <ChevronLeft className="h-4 w-4 ml-1 rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Controls */}
        <motion.div 
          variants={itemVariants}
          className="mt-12 flex justify-center space-x-4"
        >
          <button
            onClick={handleRetry}
            className="flex items-center bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow-md"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            <span className="font-medium">Try Again</span>
          </button>
          
          <button
            onClick={() => navigate('/quiz')}
            className="flex items-center border border-primary text-primary py-3 px-6 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">New Quiz</span>
          </button>
        </motion.div>
        </motion.div>
      </div>
    </ErrorBoundary>
  );
};

export default Results;
