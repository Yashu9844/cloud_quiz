import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistance } from 'date-fns';
import { Clock, Award, Check, Calendar, File, FileText, Loader2, Grid, LayoutList } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { QuizAttempt } from '@/services/quiz';
import ShareResults from './ShareResults';

// Animation configuration removed in favor of direct props

interface QuizAttemptHistoryProps {
  attempts: QuizAttempt[];
  attemptsByDate?: Record<string, QuizAttempt[]>;
  viewMode?: 'grid' | 'timeline';
  onViewModeChange?: (mode: 'grid' | 'timeline') => void;
  loading: boolean;
  error: string | null;
}

// View mode toggle component
const ViewModeToggle: React.FC<{
  viewMode: 'grid' | 'timeline';
  onChange: (mode: 'grid' | 'timeline') => void;
}> = ({ viewMode, onChange }) => {
  return (
    <div className="flex items-center justify-end gap-2 mb-6">
      <button
        onClick={() => onChange('grid')}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'grid'
            ? 'bg-primary text-white'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <Grid className="h-4 w-4 mr-2" />
        Grid
      </button>
      <button
        onClick={() => onChange('timeline')}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'timeline'
            ? 'bg-primary text-white'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <LayoutList className="h-4 w-4 mr-2" />
        Timeline
      </button>
    </div>
  );
};

const QuizAttemptHistory: React.FC<QuizAttemptHistoryProps> = ({ 
  attempts, 
  attemptsByDate = {}, 
  viewMode = 'grid',
  onViewModeChange,
  loading, 
  error 
}) => {
  // Format time in seconds to minutes and seconds
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Calculate how long ago the attempt was made
  const getTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (error) {
      console.error('Error calculating time ago:', error);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary mr-3" />
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading your quiz history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 my-6">
        <h3 className="text-red-800 dark:text-red-400 font-semibold mb-2">Error</h3>
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-8 my-6 text-center">
        <FileText className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-amber-800 dark:text-amber-400 font-semibold text-xl mb-2">No Quiz Attempts Found</h3>
        <p className="text-amber-700 dark:text-amber-300 mb-4">
          You haven't taken any quizzes yet. Start a quiz to see your results here.
        </p>
        <Link 
          to="/quiz" 
          className="inline-block bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Take a Quiz
        </Link>
      </div>
    );
  }

  // Timeline view renderer
  const renderTimelineView = () => {
    if (Object.keys(attemptsByDate).length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">No attempts to display in timeline view.</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <AnimatePresence>
          {Object.entries(attemptsByDate).map(([date, dateAttempts], groupIndex) => (
            <motion.div 
              key={date} 
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ 
                duration: 0.3,
                delay: groupIndex * 0.1,
                ease: "easeOut"
              }}
            >
            <div className="flex items-center mb-4">
              <div className="bg-primary h-8 w-8 rounded-full flex items-center justify-center text-white">
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="ml-3 text-lg font-semibold">{date}</h3>
            </div>
            
            <div className="ml-4 border-l-2 border-primary/20 pl-6 space-y-4">
              {dateAttempts.map(attempt => (
                <Card key={attempt.id} className="hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {attempt.quiz_title || `Quiz Attempt`}
                      </CardTitle>
                      <div className="bg-primary/10 text-primary font-bold py-1 px-3 rounded-full text-sm">
                        {attempt.score}%
                      </div>
                    </div>
                    <CardDescription className="mt-1">
                      {new Date(attempt.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                          {formatTime(attempt.time_taken)}
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
                  <CardFooter className="pt-3 flex justify-between">
                    <div className="flex items-center gap-3">
                      <Link 
                        to={`/results/${attempt.id}`}
                        className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                      >
                        View Details
                      </Link>
                      <ShareResults 
                        score={attempt.correct_answers}
                        totalQuestions={attempt.total_questions}
                        quizTitle={attempt.quiz_title}
                        attemptId={attempt.id}
                      />
                    </div>
                    <span className={`text-sm font-medium ${
                      attempt.score >= 80 ? 'text-green-600 dark:text-green-400' : 
                      attempt.score >= 60 ? 'text-amber-600 dark:text-amber-400' : 
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {attempt.score >= 80 ? 'Excellent' : 
                      attempt.score >= 60 ? 'Good' : 
                      'Needs Improvement'}
                    </span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    );
  };

  // Grid view renderer
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {attempts.map((attempt, index) => (
            <motion.div 
              key={attempt.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05,
                ease: "easeOut"
              }}
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
                <CardDescription className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(attempt.created_at)}
                  <span className="text-xs ml-2">({getTimeAgo(attempt.created_at)})</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {attempt.correct_answers} correct out of {attempt.total_questions} questions
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-amber-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Time taken: {formatTime(attempt.time_taken)}
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
              <CardFooter className="pt-3 flex justify-between">
                <div className="flex items-center gap-3">
                  <Link 
                    to={`/results/${attempt.id}`}
                    className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                  >
                    View Details
                  </Link>
                  <ShareResults 
                    score={attempt.correct_answers}
                    totalQuestions={attempt.total_questions}
                    quizTitle={attempt.quiz_title}
                    attemptId={attempt.id}
                    className="text-xs"
                  />
                </div>
                <span className={`text-sm font-medium ${
                  attempt.score >= 80 ? 'text-green-600 dark:text-green-400' : 
                  attempt.score >= 60 ? 'text-amber-600 dark:text-amber-400' : 
                  'text-red-600 dark:text-red-400'
                }`}>
                  {attempt.score >= 80 ? 'Excellent' : 
                   attempt.score >= 60 ? 'Good' : 
                   'Needs Improvement'}
                </span>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="mb-8">
      {viewMode === 'timeline' ? renderTimelineView() : renderGridView()}
    </div>
  );
};

export default QuizAttemptHistory;

