import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  TrendingUp, PieChart as PieChartIcon, BarChart2, 
  Percent, CheckCircle, Clock, Award, AlertCircle, Loader2,
  ChevronLeft, PlayCircle, ArrowRight, BookOpen, Brain, LightbulbIcon
} from "lucide-react";
import { fetchDashboardData, DashboardData, PerformanceHistoryItem } from "../services/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Colors for charts
const COLORS = {
  primary: "#9b87f5",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#FF5252",
  chartColors: ["#4CAF50", "#FF5252", "#FF9800", "#9b87f5", "#03A9F4"]
};

// Helper to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Interface for the statistics
interface QuizStatistics {
  totalAttempts: number;
  totalCorrectAnswers: number;
  totalQuestions: number;
  successPercentage: number;
  averageScore: number;
  attemptDates: string[];
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

// Button animation variants
const pulseVariants = {
  initial: { scale: 1 },
  pulse: { 
    scale: 1.05,
    boxShadow: "0 0 15px rgba(155, 135, 245, 0.6)",
    transition: { 
      duration: 0.8, 
      repeat: Infinity, 
      repeatType: "reverse" 
    } 
  }
};

const arrowVariants = {
  initial: { x: 0 },
  animate: {
    x: 5,
    transition: { 
      duration: 0.5, 
      repeat: Infinity, 
      repeatType: "reverse" 
    }
  }
};

const QuizDashboard: React.FC = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeChart, setActiveChart] = useState<string>("performance");
  const [statistics, setStatistics] = useState<QuizStatistics>({
    totalAttempts: 0,
    totalCorrectAnswers: 0,
    totalQuestions: 0,
    successPercentage: 0,
    averageScore: 0,
    attemptDates: []
  });
  
  // Charts data
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [correctVsIncorrectData, setCorrectVsIncorrectData] = useState<any[]>([]);
  const [overallSuccessData, setOverallSuccessData] = useState<any[]>([]);
  
  // Auth hook and navigation
  const { getCurrentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const user = getCurrentUser();
        if (!user || !user.id) {
          throw new Error('User not found. Please log in again.');
        }
        
        // Fetch dashboard data
        const data = await fetchDashboardData(user.id);
        setDashboardData(data);
        
        // Process data for statistics and charts
        if (data.performance_history && data.performance_history.length > 0) {
          processPerformanceData(data.performance_history);
        } else {
          setError('No quiz attempts found. Take a quiz to see your statistics.');
        }
        
      } catch (err) {
        console.error('Error in quiz dashboard:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchData();
    } else {
      setError('Please log in to view your quiz statistics');
      setLoading(false);
    }
  }, [getCurrentUser, isAuthenticated]);

  // Process performance data for statistics and charts
  const processPerformanceData = (performanceHistory: PerformanceHistoryItem[]) => {
    if (!performanceHistory.length) return;
    
    // Sort by date
    const sortedHistory = [...performanceHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate statistics
    const totalAttempts = sortedHistory.length;
    const totalCorrectAnswers = sortedHistory.reduce((sum, item) => sum + item.correct_answers, 0);
    const totalQuestions = sortedHistory.reduce((sum, item) => sum + item.total_questions, 0);
    const successPercentage = totalQuestions > 0 
      ? Math.round((totalCorrectAnswers / totalQuestions) * 100) 
      : 0;
    const averageScore = sortedHistory.reduce((sum, item) => sum + item.score, 0) / totalAttempts;
    const attemptDates = sortedHistory.map(item => formatDate(item.date));
    
    setStatistics({
      totalAttempts,
      totalCorrectAnswers,
      totalQuestions,
      successPercentage,
      averageScore: Math.round(averageScore),
      attemptDates
    });
    
    // Format data for performance line chart
    const formattedPerformance = sortedHistory.map(item => ({
      date: formatDate(item.date),
      score: item.score
    }));
    setPerformanceData(formattedPerformance);
    
    // Format data for correct vs incorrect bar chart
    const correctVsIncorrect = sortedHistory.map(item => ({
      date: formatDate(item.date),
      correct: item.correct_answers,
      incorrect: item.total_questions - item.correct_answers
    }));
    setCorrectVsIncorrectData(correctVsIncorrect);
    
    // Format data for overall success pie chart
    setOverallSuccessData([
      { name: 'Correct', value: totalCorrectAnswers, color: COLORS.success },
      { name: 'Incorrect', value: totalQuestions - totalCorrectAnswers, color: COLORS.error }
    ]);
  };

  // Render statistics cards
  const renderStatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-card border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center mb-3">
          <div className="bg-primary/10 p-2 rounded-lg mr-3">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-medium">Total Attempts</h3>
        </div>
        <p className="text-3xl font-bold">{statistics.totalAttempts}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Last attempt: {statistics.attemptDates[statistics.attemptDates.length - 1] || 'N/A'}
        </p>
      </motion.div>
      
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-card border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center mb-3">
          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg mr-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-medium">Correct Answers</h3>
        </div>
        <p className="text-3xl font-bold">{statistics.totalCorrectAnswers}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Out of {statistics.totalQuestions} questions
        </p>
      </motion.div>
      
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-card border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center mb-3">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg mr-3">
            <Percent className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-medium">Success Rate</h3>
        </div>
        <p className="text-3xl font-bold">{statistics.successPercentage}%</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overall success percentage
        </p>
      </motion.div>
      
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-card border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center mb-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-medium">Average Score</h3>
        </div>
        <p className="text-3xl font-bold">{statistics.averageScore}%</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Based on {statistics.totalAttempts} attempts
        </p>
      </motion.div>
    </div>
  );

  // Render charts tab navigation
  const renderChartTabs = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card border border-gray-100 dark:border-gray-700 mb-8">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6 overflow-x-auto px-4">
          {[
            { id: "performance", label: "Performance", icon: TrendingUp },
            { id: "correctVsIncorrect", label: "Correct vs Incorrect", icon: BarChart2 },
            { id: "overallSuccess", label: "Overall Success", icon: PieChartIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id)}
              className={`
                flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeChart === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}
              `}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="p-6">
        {activeChart === "performance" && renderPerformanceChart()}
        {activeChart === "correctVsIncorrect" && renderCorrectVsIncorrectChart()}
        {activeChart === "overallSuccess" && renderOverallSuccessChart()}
      </div>
    </div>
  );

  // Render performance line chart
  const renderPerformanceChart = () => (
    <div className="animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
      {renderChartContent(
        performanceData.length > 0,
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
            <Line 
              type="monotone" 
              dataKey="score" 
              name="Score"
              stroke={COLORS.primary} 
              strokeWidth={2}
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  // Render correct vs incorrect bar chart
  const renderCorrectVsIncorrectChart = () => (
    <div className="animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Correct vs Incorrect Answers</h3>
      {renderChartContent(
        correctVsIncorrectData.length > 0,
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={correctVsIncorrectData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="correct" name="Correct" fill={COLORS.success} radius={[4, 4, 0, 0]} />
            <Bar dataKey="incorrect" name="Incorrect" fill={COLORS.error} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  // Render overall success pie chart
  const renderOverallSuccessChart = () => (
    <div className="animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Overall Success Rate</h3>
      {renderChartContent(
        overallSuccessData.length > 0,
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={overallSuccessData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {overallSuccessData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}`, 'Answers']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-lg font-medium">
              Total success rate: <span className="text-primary font-bold">{statistics.successPercentage}%</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Based on {statistics.totalQuestions} total questions
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render chart content with loading and empty states
  const renderChartContent = (
    hasData: boolean,
    chart: React.ReactNode
  ) => {
    if (loading) {
      return (
        <div className="h-80 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">Loading chart data...</span>
        </div>
      );
    }
    
    if (!hasData) {
      return (
        <div className="h-80 flex justify-center items-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No data available. Take more quizzes to see statistics.</p>
        </div>
      );
    }
    
    return chart;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        className="flex-1"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/dashboard')}
                className="mr-4 flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span>Back to Dashboard</span>
              </button>
            </div>
            
            <motion.button
              onClick={() => navigate('/quiz')}
              className="mt-4 md:mt-0 flex items-center px-6 py-3 bg-primary text-white rounded-lg shadow-lg hover:bg-primary/90 transition-all"
              initial="initial"
              animate="pulse"
              variants={pulseVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BookOpen className="h-5 w-5 mr-2" />
              <span className="font-medium">Take a New Quiz</span>
              <motion.div
                initial="initial"
                animate="animate"
                variants={arrowVariants}
                className="ml-2"
              >
                <ArrowRight className="h-5 w-5" />
              </motion.div>
            </motion.button>
          </div>
          <h1 className="text-3xl font-bold mb-2">Quiz Statistics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track your quiz performance and see detailed analytics
          </p>
        </motion.div>
        
        {loading && (
          <motion.div variants={itemVariants} className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading your quiz statistics...</span>
          </motion.div>
        )}
        
        {error && !loading && (
          <motion.div variants={itemVariants} className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-amber-800 dark:text-amber-400 font-medium text-lg mb-2">No Data Available</h3>
                <p className="text-amber-700 dark:text-amber-300">{error}</p>
                
                <motion.button
                  onClick={() => navigate('/quiz')}
                  className="mt-6 flex items-center px-6 py-3 bg-primary text-white rounded-lg shadow hover:shadow-lg hover:bg-primary/90 transition-all"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LightbulbIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">Take Your First Quiz</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
        
        {!loading && !error && (
          <>
            {/* Statistics Cards */}
            {renderStatisticsCards()}
            
            {/* Chart Tabs */}
            {renderChartTabs()}
            
            {/* Summary */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-card border border-gray-100 dark:border-gray-700 mb-8"
            >
              <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Based on your {statistics.totalAttempts} quiz attempts, you've answered {statistics.totalCorrectAnswers} questions correctly
                out of {statistics.totalQuestions} total questions. Your overall success rate is {statistics.successPercentage}%,
                with an average quiz score of {statistics.averageScore}%.
              </p>
              {statistics.successPercentage > 70 ? (
                <p className="mt-4 text-green-600 dark:text-green-400">
                  Great job! Your performance is excellent. Keep up the good work!
                </p>
              ) : statistics.successPercentage > 50 ? (
                <p className="mt-4 text-amber-600 dark:text-amber-400">
                  You're doing well, but there's room for improvement. Focus on the topics you find challenging.
                </p>
              ) : (
                <p className="mt-4 text-red-600 dark:text-red-400">
                  You're making progress, but we recommend reviewing the material and practicing more frequently.
                </p>
              )}
              
              <div className="mt-6 flex justify-center">
                <motion.button
                  onClick={() => navigate('/quiz')}
                  className="group flex items-center px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Brain className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                  <span className="font-medium">Challenge Yourself With Another Quiz</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default QuizDashboard;
