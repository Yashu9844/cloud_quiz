import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, BarChart2, RotateCcw, LayoutList, Search, FilterX, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { showToast } from './ui/toast';

// Types for quiz attempt history
interface QuizAttempt {
  id: string;
  quiz_id: string;
  quiz_title: string;
  quiz_category: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  created_at: string;
}

interface QuizHistoryProps {
  className?: string;
}

const QuizHistory: React.FC<QuizHistoryProps> = ({ className = '' }) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { isAuthenticated, getToken } = useAuth();
  const navigate = useNavigate();

  // Create a list of unique categories
  const categories = [...new Set(attempts.map(attempt => attempt.quiz_category))];

  // Function to get color based on score
  const getScoreColor = (score: number) => {
    if (score < 50) return 'bg-red-500';
    if (score < 70) return 'bg-yellow-500';
    if (score < 85) return 'bg-green-500';
    return 'bg-emerald-500';
  };

  // Format time in a human-readable format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Format date in a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mock data generation (replace with actual API call in production)
  useEffect(() => {
    const fetchAttempts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real application, this would be an API call
        // For now, use mock data
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockAttempts: QuizAttempt[] = [
          {
            id: '1',
            quiz_id: 'q1',
            quiz_title: 'JavaScript Fundamentals',
            quiz_category: 'Programming',
            score: 85,
            total_questions: 20,
            correct_answers: 17,
            time_taken: 845,
            created_at: '2025-05-10T15:30:00'
          },
          {
            id: '2',
            quiz_id: 'q2',
            quiz_title: 'React Hooks',
            quiz_category: 'Programming',
            score: 72,
            total_questions: 15,
            correct_answers: 11,
            time_taken: 605,
            created_at: '2025-05-08T10:15:00'
          },
          {
            id: '3',
            quiz_id: 'q3',
            quiz_title: 'World Capitals',
            quiz_category: 'Geography',
            score: 60,
            total_questions: 25,
            correct_answers: 15,
            time_taken: 920,
            created_at: '2025-05-05T14:20:00'
          },
          {
            id: '4',
            quiz_id: 'q4',
            quiz_title: 'Basic Mathematics',
            quiz_category: 'Mathematics',
            score: 90,
            total_questions: 10,
            correct_answers: 9,
            time_taken: 480,
            created_at: '2025-05-03T09:45:00'
          },
          {
            id: '5',
            quiz_id: 'q5',
            quiz_title: 'HTML & CSS Basics',
            quiz_category: 'Programming',
            score: 78,
            total_questions: 18,
            correct_answers: 14,
            time_taken: 720,
            created_at: '2025-04-28T16:50:00'
          }
        ];
        
        setAttempts(mockAttempts);
        setFilteredAttempts(mockAttempts);
      } catch (err) {
        console.error('Error fetching quiz attempts:', err);
        setError('Failed to load your quiz history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchAttempts();
    } else {
      setLoading(false);
      setError('Please log in to view your quiz history');
    }
  }, [isAuthenticated]);

  // Filter attempts based on search term and category
  useEffect(() => {
    let filtered = [...attempts];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(attempt => 
        attempt.quiz_title.toLowerCase().includes(term) ||
        attempt.quiz_category.toLowerCase().includes(term)
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(attempt => 
        attempt.quiz_category === selectedCategory
      );
    }
    
    setFilteredAttempts(filtered);
  }, [searchTerm, selectedCategory, attempts]);

  // Retry a quiz
  const handleRetryQuiz = (quizId: string, quizTitle: string) => {
    showToast({
      message: `Loading ${quizTitle}...`,
      type: 'info',
      duration: 2000
    });
    
    // Navigate to quiz with quizId in state
    navigate('/quiz', { state: { quizId, fromResults: true } });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  if (loading) {
    return (
      <div className={`p-4 flex flex-col items-center justify-center min-h-[300px] ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-600 dark:text-gray-300">Loading your quiz history...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl">
          <p className="text-amber-700 dark:text-amber-300 mb-4">{error}</p>
          {!isAuthenticated && (
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Go to Home
            </button>
          )}
        </div>
      </div>
    );
  }
  
  if (attempts.length === 0) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
          <LayoutList className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-2">No Quiz History</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't taken any quizzes yet.</p>
          <button 
            onClick={() => navigate('/quiz')}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Take a Quiz
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Your Quiz History</h2>
        <p className="text-gray-600 dark:text-gray-400">View and retry your past quiz attempts</p>
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedCategory === category 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
          
          {(searchTerm || selectedCategory) && (
            <button
              onClick={resetFilters}
              className="flex items-center px-3 py-1.5 text-sm rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FilterX className="h-3.5 w-3.5 mr-1" />
              Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Quiz Attempt Cards */}
      {filteredAttempts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <p className="text-gray-600 dark:text-gray-400">No results match your search.</p>
          <button 
            onClick={resetFilters}
            className="mt-2 text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <motion.div 
          className="grid gap-4 md:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredAttempts.map((attempt) => (
            <motion.div
              key={attempt.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              variants={itemVariants}
            >
              <div className="relative p-5">
                {/* Score indicator */}
                <div className="absolute top-0 right-0 bottom-0 w-2 h-full rounded-r-lg flex items-center justify-center">
                  <div className={`w-2 h-full ${getScoreColor(attempt.score)}`}></div>
                </div>
                
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-lg">{attempt.quiz_title}</h3>
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-medium ${getScoreColor(attempt.score)}`}>
                        {attempt.score}%
                      </span>
                    </div>
                    
                    <span className="inline-block px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs mb-3">
                      {attempt.quiz_category}
                    </span>
                    
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <BarChart2 className="h-4 w-4 mr-2" />
                        <span>{attempt.correct_answers} of {attempt.total_questions} correct</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Time: {formatTime(attempt.time_taken)}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{formatDate(attempt.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button 
                      onClick={() => handleRetryQuiz(attempt.quiz_id, attempt.quiz_title)}
                      className="w-full flex items-center justify-center py-2 text-primary hover:bg-primary/5 rounded-md transition-colors"
                    >
                      <RotateCcw className="h-4 w-4 mr-1.5" />
                      Try Again

