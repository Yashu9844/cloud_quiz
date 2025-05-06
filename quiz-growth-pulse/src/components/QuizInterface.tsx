import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, ChevronRight, AlertCircle, Loader2, BookOpen, Code, Calculator, Brain, Dices } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

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
const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to get auth token from localStorage
const getAuthToken = () => localStorage.getItem('authToken');


const QuizInterface = () => {
  // Quiz state
  const [status, setStatus] = useState<QuizStatus>('quiz_selection');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptionSelecting, setIsOptionSelecting] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Import useNavigate and useLocation hooks
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[][]>([]);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  
  const currentQuestion = quizData.length > 0 ? quizData[currentQuestionIndex] : null;
  const progress = quizData.length > 0 ? ((currentQuestionIndex + 1) / quizData.length) * 100 : 0;
  
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
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Make API call to fetch available quizzes
      const response = await fetch(`${API_BASE_URL}/quiz`, {
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
  
  // Fetch quiz questions
  const fetchQuizQuestions = useCallback(async (quiz: Quiz) => {
    setStatus('loading');
    setError(null);
    
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // API endpoint to be implemented: fetch questions for a specific quiz
      const response = await fetch(`${API_BASE_URL}/questions?quiz_id=${quiz.id}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Parse the response
      const data = await response.json();
      
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error(`No questions available for ${quiz.title}`);
      }
      
      setQuizData(data.questions);
      
      // If the API provides a time limit, use it
      if (data.time_limit) {
        setTimeLeft(data.time_limit);
      } else {
        setTimeLeft(300); // Default to 5 minutes
      }
      
      setCurrentQuestionIndex(0);
      setSelectedOptions([]);
      setUserAnswers([]);
      setScore(0);
      setQuizStartTime(Date.now());
      setStatus('in_progress');
    } catch (err) {
      console.error('Error fetching quiz questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quiz questions. Please try again.');
      setStatus('error');
    }
  }, []);
  
  // Submit quiz attempt to backend
  const submitQuizAttempt = useCallback(async (data: QuizAttempt) => {
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Add auth token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Make API call to submit the quiz attempt
      const response = await fetch(`${API_BASE_URL}/quiz-attempt/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Parse the response if needed
      const result = await response.json();
      console.log("Quiz attempt submitted successfully:", result);
      return result;
    } catch (err) {
      console.error('Error submitting quiz attempt:', err);
      // Show error toast or notification (optional)
      // Since we're still navigating to results, just log the error
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);
  
  // Handle quiz selection
  const handleQuizSelect = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    fetchQuizQuestions(quiz);
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
  const handleSelectAnotherQuiz = () => {
    setStatus('quiz_selection');
    setSelectedQuiz(null);
  };

  const handleOptionSelect = (option: string) => {
    if (!currentQuestion) return;
    
    setIsOptionSelecting(true);
    
    try {
      // For MCQ questions, only allow one selected option
      if (currentQuestion.question_type === 'MCQ') {
        setSelectedOptions([option]);
      } else if (currentQuestion.question_type === 'MULTI_SELECT') {
        // For MULTI_SELECT, toggle the selection
        const newSelection = [...selectedOptions];
        const optionIndex = newSelection.indexOf(option);
        
        if (optionIndex === -1) {
          // Add option if not already selected
          newSelection.push(option);
        } else {
          // Remove option if already selected
          newSelection.splice(optionIndex, 1);
        }
        setSelectedOptions(newSelection);
      }
    } catch (error) {
      console.error("Error selecting option:", error);
    } finally {
      setIsOptionSelecting(false);
    }
  };
  
  const handleNextQuestion = () => {
    if (!currentQuestion) return;
    
    // Record user's answer
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentQuestionIndex] = selectedOptions;
    setUserAnswers(newUserAnswers);
    
    // Check if answer is correct
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
      
      // Quiz completed, submit the attempt
      if (selectedQuiz) {
        const timeTaken = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 300 - timeLeft;
        
        try {
          submitQuizAttempt({
            quiz_id: selectedQuiz.id,
            score: finalScore,
            total_questions: quizData.length,
            correct_answers: finalScore,
            time_taken: timeTaken
          });
        } catch (error) {
          console.error("Error submitting quiz attempt:", error);
          // Continue to completion despite submission errors
        }
      }
      
      // Mark quiz as completed
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
            <p className="text-gray-500 dark:text-gray-400 mb-2">Preparing your questions...</p>
            <div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render error state
  const renderError = () => {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-quiz overflow-hidden">
          <div className="p-6 bg-quiz-gradient border-b">
            <h2 className="text-xl font-semibold text-center">Error Loading Quiz</h2>
          </div>
          
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center mb-4 bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error || 'Failed to load quiz questions'}</p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={handleSelectAnotherQuiz}
                className="btn-outline flex items-center justify-center"
              >
                Choose Another Quiz
              </button>
              {selectedQuiz && (
                <button 
                  onClick={() => fetchQuizQuestions(selectedQuiz)}
                  className="btn-primary flex items-center justify-center"
                >
                  Try Again
                </button>
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
                disabled={selectedOptions.length === 0 || isSubmitting}
                className={`btn-primary flex items-center ${selectedOptions.length === 0 || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting && currentQuestionIndex === quizData.length - 1 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
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
    </>
  );
};

export default QuizInterface;
