import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, ChevronRight, AlertCircle, Loader2, BookOpen, Code, Calculator, Brain, Dices } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import { createAttempt, submitAnswer } from "@/services/attempt";

// Quiz model based on backend
interface Quiz {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  created_at: string;
}

// Quiz question based on backend model
interface QuizQuestion {
  id: string;
  quiz_id: string;
  content: string;
  question_type: 'MCQ' | 'MULTI_SELECT';
  options: string[];
  correct_answer: string[];
  created_at: string;
  _id?: string; // MongoDB ID field
}

// API response interface for questions
interface QuizApiResponse {
  questions: QuizQuestion[];
  time_limit?: number;
}

// Quiz attempt data structure
interface QuizAttempt {
  quiz_id: string;
  user_id?: string; // Will be extracted from auth token on server side if not provided
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
}

// Quiz Status
type QuizStatus = 'quiz_selection' | 'loading' | 'error' | 'in_progress' | 'completed';

// Difficulty colors for UI
const difficultyColors = {
  EASY: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HARD: 'bg-red-100 text-red-700',
};

// Base URL for API
const API_BASE_URL = 'http://localhost:8000/api'; // Include /api in base URL

// Import the useAuth hook for authentication
import { useAuth } from "@/contexts/AuthContext";


const QuizInterface = () => {
  // Navigation and Auth
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, getToken } = useAuth();
  
  // Quiz States
  const [status, setStatus] = useState<QuizStatus>('quiz_selection');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(300);
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  
  // UI States
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptionSelecting, setIsOptionSelecting] = useState(false);
  const [isAnswerSubmitting, setIsAnswerSubmitting] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[][]>([]);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  
  // Auth Modal States
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  
  const currentQuestion = quizData.length > 0 ? quizData[currentQuestionIndex] : null;
  const progress = quizData.length > 0 ? ((currentQuestionIndex + 1) / quizData.length) * 100 : 0;
  
  // Fetch quiz questions (declare before handleQuizSelect to avoid circular dependency)
  const fetchQuizQuestions = useCallback(async (quiz: Quiz) => {
    setStatus('loading');
    setError(null);
    
    try {
      // First check auth token
      const token = getToken();
      if (!token) {
        console.log('No auth token found. Opening sign-in modal.');
        setShowSignInModal(true);
        return;
      }

      // Validate quiz ID
      if (!quiz?.id) {
        throw new Error('Invalid quiz ID');
      }

      console.log(`Attempting to fetch questions for quiz: ${quiz.title} (${quiz.id})`);

      // Make the API request with proper error handling
      try {
        // API_BASE_URL already includes /api, so don't add it again
        const url = `${API_BASE_URL}/question/quiz?quiz_id=${quiz.id}`;
        // Log detailed request information for debugging
        console.log('Making API request with:', {
          url: url,
          token: token ? 'Bearer token present' : 'No token',
          contentType: 'application/json',
          timestamp: new Date().toISOString(),
          quizId: quiz.id,
          quizTitle: quiz.title
        });
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          // Add a reasonable timeout
          signal: AbortSignal.timeout(10000)
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', errorData);

          if (response.status === 401) {
            throw new Error('Authentication required. Please sign in again.');
          }
          if (response.status === 404) {
            throw new Error(`No questions found for "${quiz.title}". Please try another quiz.`);
          }
          throw new Error(`Failed to load questions (${response.status})`);
        }

        const data = await response.json();
        console.log('Received data:', {
          questionCount: data.questions?.length || 0,
          timeLimit: data.time_limit || 'default',
          firstQuestionPreview: data.questions && data.questions.length > 0 
            ? { 
                id: data.questions[0].id, 
                type: data.questions[0].question_type,
                hasOptions: Array.isArray(data.questions[0].options)
              } 
            : 'No questions'
        });

        if (!data.questions || !Array.isArray(data.questions)) {
          throw new Error('Invalid response format from server');
        }

        if (data.questions.length === 0) {
          throw new Error(`No questions available for "${quiz.title}". Please try another quiz.`);
        }
        
        // Create a new quiz attempt using the service
        try {
          console.log('Creating new quiz attempt for quiz:', quiz.id);
          const attempt = await createAttempt(quiz.id);
          console.log('Quiz attempt created:', attempt);
          setCurrentAttemptId(attempt.id);
        } catch (attemptError) {
          console.error('Error creating quiz attempt:', attemptError);
          // Continue with quiz even if attempt creation fails
          // This way user can still take the quiz even if the backend has issues
        }

        // Update state with received data
        setQuizData(data.questions);
        setTimeLeft(data.time_limit || 300);
        setCurrentQuestionIndex(0);
        setSelectedOptions([]);
        setUserAnswers([]);
        setScore(0);
        setQuizStartTime(Date.now());
        setStatus('in_progress');

      } catch (error) {
        console.error('Network or parsing error:', error);
        
        // Check if it's an AbortError (timeout)
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('Request timed out. The server took too long to respond.');
        }
        
        // Check for network connectivity issues
        if (!navigator.onLine) {
          throw new Error('You appear to be offline. Please check your internet connection.');
        }
        
        throw error;
      }

    } catch (error) {
      console.error('Error in fetchQuizQuestions:', error);
      
      // Clear any stale data
      setQuizData([]);
      
      // Set appropriate error message with helpful context
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load questions';
      
      setError(`${errorMessage} Please try again or choose another quiz.`);
      setStatus('error');
    }
  }, [getToken, setShowSignInModal]);
  
  // Handle quiz selection (define before it's used in useEffect)
  const handleQuizSelect = useCallback((quiz: Quiz) => {
    console.log('Quiz selected:', quiz);
    
    if (!quiz?.id) {
      setError('Invalid quiz selected');
      setStatus('error');
      return;
    }

    const token = getToken();
    if (!token) {
      console.log('No auth token found. Opening sign-in modal.');
      setShowSignInModal(true);
      // Store quiz for after login
      localStorage.setItem('pendingQuizId', quiz.id);
      return;
    }

    // Only set quiz and fetch questions if we have a valid token
    console.log(`Selected quiz: ${quiz.title} (ID: ${quiz.id})`);
    setSelectedQuiz(quiz);
    fetchQuizQuestions(quiz);
  }, [getToken, fetchQuizQuestions, setShowSignInModal, setError, setStatus, setSelectedQuiz]);
  
  // Check authentication on mount
  useEffect(() => {
    const token = getToken();
    if (!token && status !== 'quiz_selection') {
      console.warn('User is not authenticated. Showing authentication modal.');
      setError('Please sign in to take quizzes');
      setStatus('error');
    }
  }, [getToken, status]);
  
  // Add immediate auth check on component load
  useEffect(() => {
    const token = getToken();
    if (!token) {
      console.log('No auth token found on initial load');
      // Don't show modal immediately, only when trying to take a quiz
      // This prevents the modal from showing when just browsing
    }
  }, [getToken]);
  
  // Add auth check effect when a quiz is selected
  useEffect(() => {
    // Check auth status whenever a quiz is selected
    if (selectedQuiz && !getToken()) {
      console.log('Quiz selected but no valid token found. Opening sign-in modal.');
      setShowSignInModal(true);
      return;
    }
  }, [selectedQuiz, getToken]);
  
  // Handle pending quiz selection after successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      const token = getToken();
      if (!token) {
        console.log('User is authenticated but token is missing or invalid');
        return;
      }
      
      const pendingQuizId = localStorage.getItem('pendingQuizId');
      if (pendingQuizId) {
        console.log(`Attempting to resume quiz selection for quiz ID: ${pendingQuizId}`);
        const quiz = availableQuizzes.find(q => q.id === pendingQuizId);
        if (quiz) {
          console.log(`Found pending quiz: ${quiz.title}`);
          setSelectedQuiz(quiz);
          fetchQuizQuestions(quiz);
          localStorage.removeItem('pendingQuizId');
        } else {
          console.log(`No quiz found with ID: ${pendingQuizId}, removing from localStorage`);
          localStorage.removeItem('pendingQuizId');
        }
      }
    }
  }, [isAuthenticated, availableQuizzes, fetchQuizQuestions, setSelectedQuiz, getToken]);
  
  // Fetch available quizzes on component mount
  useEffect(() => {
    fetchAvailableQuizzes();
  }, []);
  
  // Handle quiz selection from URL params if provided
  useEffect(() => {
    if (location.state && location.state.quizId && status === 'quiz_selection') {
      const quizId = location.state.quizId as string;
      const selectedQuiz = availableQuizzes.find(quiz => quiz.id === quizId);
      if (selectedQuiz) {
        handleQuizSelect(selectedQuiz);
      }
    }
  }, [location, availableQuizzes, status]);
  
  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (status === 'in_progress' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer as NodeJS.Timeout);
            setStatus('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status, timeLeft]);
  // Fetch available quizzes
  const fetchAvailableQuizzes = async () => {
    setIsLoadingQuizzes(true);
    setError(null);
    
    try {
      // Get token using the auth context
      const token = getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // Show public quizzes without authentication
        console.warn('No auth token available for fetching quizzes - showing public quizzes');
      }
      
      // API_BASE_URL already includes /api, so don't add it again
      const url = `${API_BASE_URL}/quiz`;
      console.log('Fetching available quizzes from:', url);
      
      // Make API call to fetch available quizzes
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Parse the response
      const quizzes: Quiz[] = await response.json();
      
      if (!Array.isArray(quizzes) || quizzes.length === 0) {
        throw new Error('No quizzes available');
      }
      
      setAvailableQuizzes(quizzes);
      
      // Extract unique topics for filtering
      const topics = [...new Set(quizzes.map(quiz => quiz.topic))];
      console.log('Available topics:', topics);
      
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quizzes. Please try again.');
      setStatus('error');
    } finally {
      setIsLoadingQuizzes(false);
    }
  };
  
  // Helper function to check if a string is a valid UUID
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  
  // Submit the answer for the current question in real-time
  const submitAnswerToBackend = useCallback(async (
    attemptId: string, 
    questionId: string, 
    selectedAnswer: string[], 
    questionOrder: number
  ) => {
    if (!attemptId || !questionId) {
      console.error('Missing required data for answer submission', { attemptId, questionId });
      return false;
    }
    
    try {
      setIsAnswerSubmitting(true);
      console.log('Submitting answer:', {
        attemptId,
        questionId,
        selectedAnswer,
        questionOrder
      });
      
      const response = await submitAnswer(
        attemptId,
        questionId,
        selectedAnswer,
        questionOrder
      );
      
      console.log('Answer submission response:', response);
      
      // Update local state based on the response
      if (response.is_correct !== undefined) {
        // Optionally update UI to show if answer was correct
        console.log(`Answer was ${response.is_correct ? 'correct' : 'incorrect'}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error submitting answer:', error);
      // Don't block quiz progress on submission errors
      // Just log and continue
      return false;
    } finally {
      setIsAnswerSubmitting(false);
    }
  }, []);
  
  // Helper function to validate quiz_id
  const validateQuizId = (quizId: string): boolean => {
    if (!quizId || quizId.trim() === '') {
      console.error('Invalid quiz ID: Empty or undefined');
      return false;
    }
    
    // Add any specific quiz_id format validation here
    // For example, if it should be a UUID or have specific format
    
    return true;
  };

  
  // Filter quizzes by difficulty and topic
  const getFilteredQuizzes = () => {
    return availableQuizzes.filter(quiz => 
      (!selectedDifficulty || quiz.difficulty === selectedDifficulty) &&
      (!selectedTopic || quiz.topic === selectedTopic)
    );
  };
  
  // Reset filters
  const resetFilters = () => {
    setSelectedDifficulty(null);
    setSelectedTopic(null);
  };
  
  // Retry quiz with same quiz
  const handleRetryQuiz = () => {
    if (selectedQuiz) {
      fetchQuizQuestions(selectedQuiz);
    } else {
      setStatus('quiz_selection');
    }
  };
  
  // Go back to quiz selection
  const handleSelectAnotherQuiz = useCallback(() => {
    setStatus('quiz_selection');
    setSelectedQuiz(null);
    setError(null);
  }, []);

  const handleOptionSelect = async (option: string) => {
    if (!currentQuestion) return;
    
    setIsOptionSelecting(true);
    
    try {
      let newSelection: string[] = [];
      
      // For MCQ questions, only allow one selected option
      if (currentQuestion.question_type === 'MCQ') {
        newSelection = [option];
        setSelectedOptions(newSelection);
        
        // For MCQ, submit the answer immediately since it's a single choice
        if (currentAttemptId) {
          try {
            await submitAnswerToBackend(
              currentAttemptId,
              currentQuestion.id,
              newSelection,
              currentQuestionIndex + 1
            );
          } catch (submitError) {
            console.error("Error submitting answer:", submitError);
            // Continue with quiz even if submission fails
          }
        }
      } else if (currentQuestion.question_type === 'MULTI_SELECT') {
        // For MULTI_SELECT, toggle the selection
        newSelection = [...selectedOptions];
        const optionIndex = newSelection.indexOf(option);
        
        if (optionIndex === -1) {
          // Add option if not already selected
          newSelection.push(option);
        } else {
          // Remove option if already selected
          newSelection.splice(optionIndex, 1);
        }
        setSelectedOptions(newSelection);
        
        // For multi-select, we don't submit until the "Next" button is clicked
        // as the user may select/deselect multiple options
      }
    } catch (error) {
      console.error("Error selecting option:", error);
    } finally {
      setIsOptionSelecting(false);
    }
  };
  
  const handleNextQuestion = async () => {
    if (!currentQuestion) return;
    
    // Record user's answer
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestionIndex] = selectedOptions;
    setUserAnswers(newUserAnswers);
    
    // Check if answer is correct locally (for UI feedback)
    let isCorrect = false;
    if (currentQuestion.question_type === 'MCQ') {
      isCorrect = currentQuestion.correct_answer.includes(selectedOptions[0]);
    } else if (currentQuestion.question_type === 'MULTI_SELECT') {
      // For multi-select, all correct answers must be selected and no incorrect ones
      const selectedSet = new Set(selectedOptions);
      const correctSet = new Set(currentQuestion.correct_answer);
      
      // Check if sets have the same size and all elements from selected are in correct
      isCorrect = 
        selectedSet.size === correctSet.size && 
        selectedOptions.every(option => correctSet.has(option));
        
      // For MULTI_SELECT, submit the answer when Next is clicked
      if (currentAttemptId) {
        try {
          setIsAnswerSubmitting(true);
          await submitAnswerToBackend(
            currentAttemptId,
            currentQuestion.id,
            selectedOptions,
            currentQuestionIndex + 1
          );
        } catch (submitError) {
          console.error("Error submitting multi-select answer:", submitError);
          // Continue with quiz even if submission fails
        } finally {
          setIsAnswerSubmitting(false);
        }
      }
    }
    
    // Update score if answer is correct
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    }
    
    if (currentQuestionIndex < quizData.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOptions([]);
    } else {
      // Calculate final score
      const finalScore = isCorrect ? score + 1 : score;
      setScore(finalScore);
      
      // The quiz is now completed
      // The backend will automatically complete the attempt when all answers are submitted
      setStatus('completed');
    }
  };
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Render quiz selection
  const renderQuizSelection = () => {
    const filteredQuizzes = getFilteredQuizzes();
    const allTopics = [...new Set(availableQuizzes.map(quiz => quiz.topic))];
    
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-quiz overflow-hidden">
          <div className="p-6 bg-quiz-gradient border-b">
            <h2 className="text-xl font-semibold text-center">Choose a Quiz</h2>
            <p className="text-center text-gray-500 mt-2">Select the quiz you want to take</p>
          </div>
          
          {isLoadingQuizzes ? (
            <div className="p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="mx-auto"
              >
                <Loader2 className="h-8 w-8 text-primary" />
              </motion.div>
              <p className="mt-4 text-gray-500">Loading available quizzes...</p>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex flex-wrap gap-2 justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Filter by difficulty:</p>
                    <div className="flex flex-wrap gap-2">
                      {(['EASY', 'MEDIUM', 'HARD'] as const).map(difficulty => (
                        <button
                          key={difficulty}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedDifficulty === difficulty 
                              ? difficultyColors[difficulty] + ' border-2 border-current' 
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                          onClick={() => setSelectedDifficulty(
                            selectedDifficulty === difficulty ? null : difficulty
                          )}
                        >
                          {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Filter by topic:</p>
                    <div className="flex flex-wrap gap-2">
                      {allTopics.map(topic => (
                        <button
                          key={topic}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedTopic === topic 
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-700' 
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                          onClick={() => setSelectedTopic(
                            selectedTopic === topic ? null : topic
                          )}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {(selectedDifficulty || selectedTopic) && (
                  <button
                    className="mt-2 text-xs text-primary hover:underline"
                    onClick={resetFilters}
                  >
                    Clear filters
                  </button>
                )}
              </div>
              
              {/* Quiz List */}
              <div className="p-6">
                {filteredQuizzes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No quizzes match your filters.</p>
                    <button 
                      className="btn-outline text-sm"
                      onClick={resetFilters}
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredQuizzes.map(quiz => (
                      <motion.div
                        key={quiz.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 cursor-pointer border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-colors"
                        onClick={() => handleQuizSelect(quiz)}
                      >
                        <div className="flex items-start">
                          <div className={`p-3 rounded-lg mr-4 ${difficultyColors[quiz.difficulty]}`}>
                            {quiz.topic === 'Computer Science' ? <Code className="h-6 w-6" /> : 
                             quiz.topic === 'Mathematics' ? <Calculator className="h-6 w-6" /> :
                             quiz.topic === 'General Knowledge' ? <BookOpen className="h-6 w-6" /> :
                             quiz.topic === 'Trivia' ? <Dices className="h-6 w-6" /> :
                             <Brain className="h-6 w-6" />}
                          </div>
                          <div>
                            <div className="flex items-center mb-1">
                              <h3 className="font-medium">{quiz.title}</h3>
                              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${difficultyColors[quiz.difficulty]}`}>
                                {quiz.difficulty.charAt(0) + quiz.difficulty.slice(1).toLowerCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{quiz.description}</p>
                            <p className="text-xs text-gray-400 mt-2">Topic: {quiz.topic}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };
  
  // Render loading state
  const renderLoading = () => {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-quiz overflow-hidden">
          <div className="p-6 bg-quiz-gradient border-b">
            <h2 className="text-xl font-semibold text-center mb-4">
              {selectedQuiz ? selectedQuiz.title : 'Loading Quiz'}
            </h2>
            <div className="flex justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-8 w-8 text-primary" />
              </motion.div>
            </div>
          </div>
          
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {selectedQuiz ? `Fetching questions for "${selectedQuiz.title}" quiz...` : 'Preparing your questions...'}
            </p>
            <div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Connecting to {API_BASE_URL}/question/quiz?quiz_id={selectedQuiz?.id}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Render error state
  const renderError = () => {
    const isAuthError = error?.toLowerCase().includes('auth') || 
                       error?.toLowerCase().includes('sign in') || 
                       !isAuthenticated;
    
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-quiz overflow-hidden">
          <div className="p-6 bg-quiz-gradient border-b">
            <h2 className="text-xl font-semibold text-center">
              {isAuthError ? 'Authentication Required' : 'Error Loading Quiz'}
            </h2>
          </div>
          
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center mb-4 bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {isAuthError ? 'Please Sign In' : 'Something went wrong'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
            
            {/* Technical Details for non-auth errors */}
            {!isAuthError && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-left">
                <p className="text-sm font-medium mb-2">Technical Details:</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Browser: {navigator.userAgent}</p>
                  <p>Network Status: {navigator.onLine ? "Online" : "Offline"}</p>
                  <p>Time: {new Date().toISOString()}</p>
                  <p>Quiz ID: {selectedQuiz?.id || 'None selected'}</p>
                  <p>API endpoint: {`${API_BASE_URL}/question/quiz`}</p>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isAuthError ? (
                <button 
                  onClick={() => setShowSignInModal(true)}
                  className="btn-primary"
                >
                  Sign In to Continue
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleSelectAnotherQuiz}
                    className="btn-outline"
                  >
                    Choose Another Quiz
                  </button>
                  {selectedQuiz && (
                    <button 
                      onClick={() => fetchQuizQuestions(selectedQuiz)}
                      className="btn-primary"
                    >
                      Try Again
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render quiz interface
  const renderQuiz = () => {
    if (!currentQuestion || !selectedQuiz) return null;
    
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-quiz overflow-hidden">
          {/* Quiz Header */}
          <div className="p-6 bg-quiz-gradient border-b">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedQuiz.title}</h2>
              <div className="flex items-center text-sm font-medium bg-white/80 dark:bg-gray-700/80 px-3 py-1.5 rounded-full shadow-sm animate-pulse-soft">
                <Clock className="h-4 w-4 mr-1.5 text-primary" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: `${((currentQuestionIndex) / quizData.length) * 100}%` }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {quizData.length}
            </div>
          </div>
          
          {/* Question Area */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-medium mb-6">{currentQuestion.content}</h3>
                
                {/* Options */}
                <div className="space-y-3 mb-8">
                  {currentQuestion.options.map((option, index) => (
                    <div 
                      key={index} 
                      className={`quiz-option ${selectedOptions.includes(option) ? 'quiz-option-selected' : ''} ${isOptionSelecting ? 'cursor-wait' : 'cursor-pointer'}`}
                      onClick={() => !isOptionSelecting && handleOptionSelect(option)}
                    >
                      <div className="flex items-start">
                        <div className={`
                          flex items-center justify-center w-6 h-6 rounded-full mr-3 mt-0.5
                          ${selectedOptions.includes(option) ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
                        `}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span>{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6">
              <button 
                className="flex items-center text-gray-500 hover:text-primary transition-colors"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Report Issue</span>
              </button>
              
              <button
                onClick={handleNextQuestion}
                disabled={selectedOptions.length === 0 || isSubmitting || isAnswerSubmitting}
                className={`btn-primary flex items-center ${selectedOptions.length === 0 || isSubmitting || isAnswerSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {(isSubmitting || isAnswerSubmitting) && currentQuestionIndex === quizData.length - 1 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : isAnswerSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Answer...
                  </>
                ) : (
                  <>
                    {currentQuestionIndex === quizData.length - 1 ? 'Submit' : 'Next'}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Handle quiz completion - navigate to results
  useEffect(() => {
    if (status === 'completed' && !isNavigating && !isSubmitting) {
      const timeTaken = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 300 - timeLeft;
      
      // Prevent multiple navigations
      setIsNavigating(true);
      
      // Get quiz details
      const quizTitle = selectedQuiz?.title;
      const quizTopic = selectedQuiz?.topic;
      
      // Calculate correct answers
      let correctAnswers = 0;
      userAnswers.forEach((answers, index) => {
        if (index < quizData.length) {
          const question = quizData[index];
          
          if (question.question_type === 'MCQ') {
            if (question.correct_answer.includes(answers[0])) {
              correctAnswers++;
            }
          } else if (question.question_type === 'MULTI_SELECT') {
            const selectedSet = new Set(answers);
            const correctSet = new Set(question.correct_answer);
            
            if (selectedSet.size === correctSet.size && 
                answers.every(answer => correctSet.has(answer))) {
              correctAnswers++;
            }
          }
        }
      });
      
      // Navigate to results with state
      navigate("/results", {
        state: {
          score: correctAnswers, // Use accurately calculated score
          totalQuestions: quizData.length,
          timeTaken,
          quizId: selectedQuiz?.id,
          quizTitle: quizTitle,
          quizTopic: quizTopic
        }
      });
    }
  }, [status, navigate, score, quizData.length, quizStartTime, timeLeft, selectedQuiz, isNavigating, isSubmitting]);
  
  // Main render method - conditionally render based on status
  return (
    <>
      {status === 'quiz_selection' && renderQuizSelection()}
      {status === 'loading' && renderLoading()}
      {status === 'error' && renderError()}
      {status === 'in_progress' && renderQuiz()}
      
      {/* Authentication Modals */}
      <SignInModal 
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSwitchToSignUp={() => {
          setShowSignInModal(false);
          setShowSignUpModal(true);
        }}
      />
      
      <SignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onSwitchToSignIn={() => {
          setShowSignUpModal(false);
          setShowSignInModal(true);
        }}
      />
    </>
  );
};

export default QuizInterface;
