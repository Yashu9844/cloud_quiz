
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, RotateCcw, Eye, Award, Share2, Loader2, BarChart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "./ui/toast";

// Badge interface based on backend model
interface Badge {
  id: string;
  name: string;
  description: string;
  min_score_threshold: number;
  created_at: string;
}

// QuizAttempt interface based on backend model
interface QuizAttempt {
  id?: string;
  quiz_id: string;
  user_id?: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  created_at?: string;
}

interface ResultPageProps {
  score: number;
  totalQuestions: number;
  onRetry: () => void;
  onReview: () => void;
  timeTaken: number;
  categoryId?: string;
  categoryName?: string;
}

// API Base URL
const API_BASE_URL = '/api';

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('authToken');

const ResultPage = ({
  score: propScore,
  totalQuestions: propTotalQuestions,
  onRetry: propOnRetry,
  onReview: propOnReview,
  timeTaken: propTimeTaken,
  categoryId: propCategoryId,
  categoryName: propCategoryName
}: ResultPageProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [badge, setBadge] = useState<Badge | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Router state and navigation
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // Get quiz data from props or location state
  const score = location.state?.score ?? propScore;
  const totalQuestions = location.state?.totalQuestions ?? propTotalQuestions;
  const timeTaken = location.state?.timeTaken ?? propTimeTaken;
  const categoryId = location.state?.categoryId ?? propCategoryId;
  const categoryName = location.state?.categoryName ?? propCategoryName;
  
  // Calculate percentage score
  const percentage = Math.round((score / totalQuestions) * 100);
  
  // Determine result type based on score
  const resultType = percentage >= 80 ? 'high' : percentage >= 50 ? 'medium' : 'low';
  
  // Badge level based on score - this is a fallback if API fails
  const defaultBadgeLevel = percentage >= 80 ? 'Pro' : percentage >= 50 ? 'Intermediate' : 'Beginner';
  
  // Fetch badge from backend based on score
  useEffect(() => {
    const fetchBadge = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = getAuthToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        // Add authentication token if available
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Fetch badges from API
        const response = await fetch(`${API_BASE_URL}/badges`, {
          method: 'GET',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const badges: Badge[] = await response.json();
        
        // Find the badge that matches the user's score
        const earnedBadge = badges
          .filter(b => percentage >= b.min_score_threshold)
          .sort((a, b) => b.min_score_threshold - a.min_score_threshold)[0];
          
        if (earnedBadge) {
          setBadge(earnedBadge);
        }
      } catch (err) {
        console.error('Error fetching badge:', err);
        setError('Failed to load badge data');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if we have a score
    if (score !== undefined && totalQuestions > 0) {
      fetchBadge();
    }
  }, [score, percentage, totalQuestions]);
  
  // Show confetti animation for high scores
  useEffect(() => {
    if (percentage >= 70) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [percentage]);

  // Handle retry - navigate back to quiz with same category
  const handleRetry = () => {
    if (propOnRetry) {
      propOnRetry();
    } else {
      navigate("/", { state: { selectedCategory: categoryId } });
    }
  };

  // Handle review - currently just a placeholder using alert
  const handleReview = () => {
    if (propOnReview) {
      propOnReview();
    } else {
      // For now, just show an alert
      alert("Review functionality would go here");
    }
  };

  // Handle navigation to dashboard with auth check
  const handleDashboardNavigation = () => {
    // Prevent multiple clicks
    if (isNavigating) return;
    
    // Check if we're loading auth or badge data
    if (isAuthLoading) {
      showToast({
        message: "Please wait while we verify your authentication...",
        type: "info",
        duration: 3000
      });
      return;
    }
    
    if (isLoading) {
      showToast({
        message: "Please wait while we load your results...",
        type: "info",
        duration: 3000
      });
      return;
    }

    // Save quiz results for after authentication if needed
    if (score !== undefined && totalQuestions > 0) {
      try {
        // Store quiz result info to be retrieved after auth
        localStorage.setItem('pendingQuizResults', JSON.stringify({
          score,
          totalQuestions,
          percentage,
          timeTaken,
          categoryId,
          categoryName
        }));
      } catch (error) {
        console.error('Failed to store quiz results:', error);
      }
    }
    
    // Set navigating state to provide feedback
    setIsNavigating(true);
    
    showToast({
      message: isAuthenticated 
        ? "Loading your dashboard..." 
        : "Please sign in to view your dashboard",
      type: isAuthenticated ? "info" : "warning",
      duration: 2000
    });
    
    // If not authenticated, store the intended destination
    if (!isAuthenticated) {
      localStorage.setItem('pendingDashboardRedirect', '/dashboard');
    }
    
    // Navigate to dashboard (which will handle auth state)
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };
  
  const confettiColors = ['#9b87f5', '#6EDCD9', '#FFC107', '#FF5722'];
  
  return (
    <div className="max-w-xl mx-auto p-4">
      {/* Confetti effect for high scores */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          {Array.from({ length: 100 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                top: '-10px',
                left: `${Math.random() * 100}%`,
                backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)]
              }}
              initial={{ 
                scale: Math.random() * 0.5 + 0.5, 
                opacity: 1, 
                y: 0, 
                x: 0, 
                rotate: 0 
              }}
              animate={{ 
                y: window.innerHeight,
                x: (Math.random() - 0.5) * 200, 
                rotate: Math.random() * 360, 
                opacity: 0 
              }}
              transition={{ 
                duration: Math.random() * 2 + 1.5, 
                ease: "easeOut" 
              }}
            />
          ))}
        </div>
      )}
      
      <motion.div
        className={`
          bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border
          ${resultType === 'high' ? 'border-green-200' : resultType === 'medium' ? 'border-amber-200' : 'border-red-200'}
        `}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Header section with result background */}
        <div 
          className={`
            p-8 text-center
            ${resultType === 'high' ? 'bg-result-success text-gray-800' : 
              resultType === 'medium' ? 'bg-result-warning text-gray-800' : 
              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'}
          `}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
            className="mx-auto w-24 h-24 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center mb-4"
          >
            <div className="text-3xl font-bold">{percentage}%</div>
          </motion.div>
          
          <h2 className="text-2xl font-bold mb-1">
            {resultType === 'high' ? 'Excellent!' : 
             resultType === 'medium' ? 'Good job!' : 
             'Keep practicing!'}
          </h2>
          <p className="text-gray-700 dark:text-gray-200">
            You answered {score} out of {totalQuestions} questions correctly.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Time taken: {Math.floor(timeTaken / 60)}m {timeTaken % 60}s
          </p>
        </div>
        
        {/* Badge section */}
        <div className="p-6 flex items-center justify-center border-b border-gray-100 dark:border-gray-700">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin h-6 w-6 text-primary" />
            </div>
          ) : (
            <motion.div 
              className="flex flex-col items-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center mb-3
                ${badge?.name === 'Pro' || (!badge && defaultBadgeLevel === 'Pro') ? 'bg-primary/10' : 
                  badge?.name === 'Intermediate' || (!badge && defaultBadgeLevel === 'Intermediate') ? 'bg-amber-100' : 
                  'bg-gray-100'}
              `}>
                <Award className={`
                  w-8 h-8
                  ${badge?.name === 'Pro' || (!badge && defaultBadgeLevel === 'Pro') ? 'text-primary' : 
                    badge?.name === 'Intermediate' || (!badge && defaultBadgeLevel === 'Intermediate') ? 'text-amber-500' : 
                    'text-gray-500'}
                `} />
              </div>
              <span className="text-sm font-medium">
                {badge ? `${badge.name} Badge` : `${defaultBadgeLevel} Badge`}
              </span>
              {badge && (
                <p className="text-xs text-gray-500 text-center mt-1">{badge.description}</p>
              )}
            </motion.div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="p-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={handleReview}
            className="btn-outline flex items-center justify-center"
          >
            <Eye className="mr-2 h-4 w-4" />
            Review Answers
          </button>
          <button 
            onClick={handleDashboardNavigation}
            className="btn-secondary flex items-center justify-center"
            disabled={isNavigating || isAuthLoading}
          >
            {isNavigating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <BarChart className="mr-2 h-4 w-4" />
                View Dashboard
              </>
            )}
          </button>
          <button 
            onClick={handleRetry}
            className="btn-primary flex items-center justify-center"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </button>
        </div>
        
        {/* Share results */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <button 
            className="w-full flex items-center justify-center py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
            onClick={() => {
              // Share functionality using Web Share API if available
              if (navigator.share) {
                navigator.share({
                  title: 'My Quiz Results',
                  text: `I scored ${percentage}% (${score}/${totalQuestions}) on the ${categoryName || 'quiz'}!`,
                  url: window.location.href,
                }).catch((error) => console.log('Error sharing', error));
              } else {
                // Fallback for browsers that don't support the Web Share API
                alert(`Share your score: ${percentage}% (${score}/${totalQuestions}) on the ${categoryName || 'quiz'}!`);
              }
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Results
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ResultPage;
