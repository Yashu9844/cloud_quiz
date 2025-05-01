
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, ChevronRight, AlertCircle } from "lucide-react";

// Mock quiz data structure
interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answer: number;
}

const sampleQuizData: QuizQuestion[] = [
  {
    id: 1,
    question: "Which data structure uses LIFO ordering?",
    options: ["Queue", "Stack", "Linked List", "Tree"],
    answer: 1
  },
  {
    id: 2,
    question: "What is the time complexity of binary search?",
    options: ["O(n)", "O(log n)", "O(n²)", "O(n log n)"],
    answer: 1
  },
  {
    id: 3,
    question: "Which sorting algorithm has the best average time complexity?",
    options: ["Bubble Sort", "Insertion Sort", "Quick Sort", "Selection Sort"],
    answer: 2
  }
];

const QuizInterface = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  
  const currentQuestion = sampleQuizData[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / sampleQuizData.length) * 100;

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < sampleQuizData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      // Quiz completed - would navigate to results in a real app
      alert("Quiz completed!");
    }
  };
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-quiz overflow-hidden">
        {/* Quiz Header */}
        <div className="p-6 bg-quiz-gradient border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Computer Science Quiz</h2>
            <div className="flex items-center text-sm font-medium bg-white/80 dark:bg-gray-700/80 px-3 py-1.5 rounded-full shadow-sm animate-pulse-soft">
              <Clock className="h-4 w-4 mr-1.5 text-primary" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: `${((currentQuestionIndex) / sampleQuizData.length) * 100}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {sampleQuizData.length}
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
              <h3 className="text-xl font-medium mb-6">{currentQuestion.question}</h3>
              
              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, index) => (
                  <div 
                    key={index} 
                    className={`quiz-option ${selectedOption === index ? 'quiz-option-selected' : ''}`}
                    onClick={() => handleOptionSelect(index)}
                  >
                    <div className="flex items-start">
                      <div className={`
                        flex items-center justify-center w-6 h-6 rounded-full mr-3 mt-0.5
                        ${selectedOption === index ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
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
              disabled={selectedOption === null}
              className={`btn-primary flex items-center ${selectedOption === null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {currentQuestionIndex === sampleQuizData.length - 1 ? 'Submit' : 'Next'}
              <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;
