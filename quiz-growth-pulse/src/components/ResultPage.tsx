
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, RotateCcw, Eye, Award, Share2 } from "lucide-react";

interface ResultPageProps {
  score: number;
  totalQuestions: number;
  onRetry: () => void;
  onReview: () => void;
}

const ResultPage = ({
  score = 2,
  totalQuestions = 3,
  onRetry = () => {},
  onReview = () => {}
}: ResultPageProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Calculate percentage score
  const percentage = Math.round((score / totalQuestions) * 100);
  
  // Determine result type based on score
  const resultType = percentage >= 80 ? 'high' : percentage >= 50 ? 'medium' : 'low';
  
  // Badge level based on score
  const badgeLevel = percentage >= 80 ? 'Pro' : percentage >= 50 ? 'Intermediate' : 'Beginner';
  
  // Show confetti animation for high scores
  useEffect(() => {
    if (percentage >= 70) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [percentage]);

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
        </div>
        
        {/* Badge section */}
        <div className="p-6 flex items-center justify-center border-b border-gray-100 dark:border-gray-700">
          <motion.div 
            className="flex flex-col items-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-3
              ${badgeLevel === 'Pro' ? 'bg-primary/10' : 
                badgeLevel === 'Intermediate' ? 'bg-amber-100' : 
                'bg-gray-100'}
            `}>
              <Award className={`
                w-8 h-8
                ${badgeLevel === 'Pro' ? 'text-primary' : 
                  badgeLevel === 'Intermediate' ? 'text-amber-500' : 
                  'text-gray-500'}
              `} />
            </div>
            <span className="text-sm font-medium">{badgeLevel} Badge</span>
          </motion.div>
        </div>
        
        {/* Action buttons */}
        <div className="p-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={onReview}
            className="btn-outline flex items-center justify-center"
          >
            <Eye className="mr-2 h-4 w-4" />
            Review Answers
          </button>
          <button 
            onClick={onRetry}
            className="btn-primary flex items-center justify-center"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </button>
        </div>
        
        {/* Share results */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <button className="w-full flex items-center justify-center py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
            <Share2 className="mr-2 h-4 w-4" />
            Share Results
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ResultPage;
