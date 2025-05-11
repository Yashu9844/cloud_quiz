import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PieChart, Pie, Cell
} from "recharts";
import { TrendingUp, BookOpen, Target, Calendar, BrainCircuit, AlertCircle, Loader2, LogIn, BarChart2, ExternalLink } from "lucide-react";
import { fetchDashboardData, DashboardData } from "../services/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Topic colors for visualization
const topicColors = {
  low: "#FF5252",     // Red for low scores
  medium: "#FF9800",  // Orange for medium scores
  high: "#8BC34A",    // Light green for good scores
  excellent: "#4CAF50" // Green for excellent scores
};

// Function to assign colors based on score
const getScoreColor = (score: number) => {
  if (score < 50) return topicColors.low;
  if (score < 70) return topicColors.medium;
  if (score < 85) return topicColors.high;
  return topicColors.excellent;
};

// Date formatter for chart display
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Main Dashboard Component
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("performance");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [authRetryCount, setAuthRetryCount] = useState(0);
  
  // Auth hooks
  const { getCurrentUser, isAuthenticated, getToken } = useAuth();
  const navigate = useNavigate();
  
  // Derived state for charts
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [weakTopicsData, setWeakTopicsData] = useState<any[]>([]);
  const [masteryData, setMasteryData] = useState<any[]>([{ name: "Mastery", value: 0, fill: "#9b87f5" }]);
  
  // Animation variants for elements
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

  // Auth debug effect - logs auth state information
  useEffect(() => {
    // Debug log for auth state
    console.group('🛡️ Dashboard Auth Debug');
    console.log('🔑 Is authenticated:', isAuthenticated);
    
    // Check token
    const token = getToken();
    console.log('🎟️ Token available:', !!token);
    
    if (token) {
      try {
        // Basic token validation - decode and log expiration
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = new Date(decoded.exp * 1000);
        const now = new Date();
        console.log('⏱️ Token expires:', expiresAt.toLocaleString());
        console.log('⌛ Time remaining:', Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60), 'minutes');
      } catch (e) {
        console.error('❌ Token parse error:', e);
      }
    }
    
    // Check user data
    const user = getCurrentUser();
    console.log('👤 User data available:', !!user);
    if (user) {
      console.log('👤 User ID:', user.id);
      console.log('👤 Username:', user.username);
    }
    
    console.groupEnd();
    
    // If auth state is invalid but we haven't exceeded retry count, try again after delay
    if (!isAuthenticated && authRetryCount < 2) {
      console.log(`🔄 Auth retry attempt ${authRetryCount + 1}/2...`);
      const timer = setTimeout(() => {
        setAuthRetryCount(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, getCurrentUser, getToken, authRetryCount]);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setAuthError(false);
        
        // Get current user from auth context
        const user = getCurrentUser();
        if (!user || !user.id) {
          console.error('No user data found in auth context');
          setAuthError(true);
          throw new Error('User not found. Please log in again.');
        }
        
        console.log('Fetching dashboard data for user:', user.id);
        
        // Fetch dashboard data from API with retry logic
        try {
          const data = await fetchDashboardData(user.id);
          setDashboardData(data);
        
        // Transform data for charts
        
        // 1. Performance history chart
        if (data.performance_history && data.performance_history.length > 0) {
          const formattedPerformance = data.performance_history
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(item => ({
              date: formatDate(item.date),
              score: item.score,
              correct: item.correct_answers,
              total: item.total_questions
            }));
          setPerformanceData(formattedPerformance);
        }
        
        // 2. Weak topics chart
        if (data.topic_proficiency && Object.keys(data.topic_proficiency).length > 0) {
          const topicItems = Object.entries(data.topic_proficiency)
            .map(([name, score]) => ({
              name,
              score,
              fill: getScoreColor(score)
            }))
            .sort((a, b) => a.score - b.score)  // Sort by score ascending (weak topics first)
            .slice(0, 5);  // Take top 5 weakest topics
            
          setWeakTopicsData(topicItems);
        } else if (data.weak_topics && Object.keys(data.weak_topics).length > 0) {
          // Fallback to weak_topics object if no proficiency scores
          const topicItems = Object.entries(data.weak_topics).map(([topic, score], index) => ({
            name: topic,
            score: typeof score === 'number' ? score : 50 - (index * 5), // Use score from object or fallback
            fill: topicColors.low
          }));
          setWeakTopicsData(topicItems);
        }
        
        // 3. Mastery level chart
        // Calculate average mastery level from performance history or use a default
        if (data.performance_history && data.performance_history.length > 0) {
          const scores = data.performance_history.map(item => item.score);
          const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          setMasteryData([{ name: "Mastery", value: Math.round(averageScore), fill: "#9b87f5" }]);
        } else if (data.topic_proficiency && Object.keys(data.topic_proficiency).length > 0) {
          // Alternative: calculate from topic proficiency
          const proficiencyValues = Object.values(data.topic_proficiency);
          const averageProficiency = proficiencyValues.reduce((sum, val) => sum + val, 0) / proficiencyValues.length;
          setMasteryData([{ name: "Mastery", value: Math.round(averageProficiency), fill: "#9b87f5" }]);
        }
        
        } catch (fetchError) {
          console.error('Error fetching dashboard data:', fetchError);
          
          // Determine if we should retry
          if (retryCount < 2) {
            console.log(`Retrying dashboard fetch (${retryCount + 1}/2)...`);
            setRetryCount(prev => prev + 1);
            
            // Add delay before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try again
            const data = await fetchDashboardData(user.id);
            setDashboardData(data);
            
            // Process data as before
            // (Same transformation code for charts)
          } else {
            throw fetchError; // Propagate error after retries exhausted
          }
        }
        
      } catch (err) {
        console.error('Error in dashboard:', err);
        
        // Handle specific error types
        if (err instanceof Error) {
          if (err.message.includes('Authentication required') || 
              err.message.includes('User not found') ||
              err.message.includes('token')) {
            setAuthError(true);
          }
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchData();
    } else {
      // Only set auth error if we've exhausted retries
      if (authRetryCount >= 2) {
        console.log('📊 Dashboard: Auth retries exhausted, showing error');
        setAuthError(true);
        setError('Please log in to view your dashboard');
        setLoading(false);
      } else {
        console.log('📊 Dashboard: Waiting for auth retry...');
      }
    }
  }, [getCurrentUser, isAuthenticated, retryCount, authRetryCount]);

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Track your progress and get AI-powered insights
          </p>
        </div>
        
        <motion.button
          onClick={() => navigate('/dashboard/quiz-stats')}
          className="flex items-center px-6 py-3 bg-primary text-white rounded-lg shadow-md hover:shadow-lg hover:bg-primary/90 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <BarChart2 className="h-5 w-5 mr-2" />
          <span className="font-medium">Quiz Statistics</span>
          <ExternalLink className="h-4 w-4 ml-1" />
        </motion.button>
      </div>
      
      {/* Loading and Error States */}
      {loading ? (
        <div className="flex flex-col justify-center items-center min-h-[400px] bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <span className="text-gray-600 dark:text-gray-300">Loading dashboard data...</span>
            </div>
          ) : authError ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-8 rounded-xl border border-amber-200 dark:border-amber-800 text-center shadow-md">
              <div className="mx-auto mb-4 bg-amber-100 dark:bg-amber-800/30 p-3 rounded-full inline-flex">
                <LogIn className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-amber-800 dark:text-amber-400 font-medium text-lg mb-2">Authentication Required</h3>
              <p className="text-amber-700 dark:text-amber-300 mb-6">{error || "Please log in to view your dashboard"}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  className="px-5 py-2.5 bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-200 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-700 transition-colors"
                  onClick={() => navigate('/')}
                >
                  Go to Home Page
                </button>
                <button 
                  className="px-5 py-2.5 bg-primary text-white rounded-lg shadow-md hover:shadow-lg hover:bg-primary/90 transition-all"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800 shadow-md">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-red-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">Error Loading Dashboard</h3>
                  <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <motion.div 
              className="grid gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Dashboard Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Insights Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-100 dark:border-gray-700 lg:col-span-3">
                  <div className="flex items-start mb-4">
                    <div className="bg-primary/10 p-3 rounded-xl mr-4">
                      <BrainCircuit className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI-Driven Insights</h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">Based on your recent quiz performance</p>
                    </div>
                  </div>
                  
                  <div className="p-5 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl mb-4">
                    <p className="text-gray-800 dark:text-gray-200">
                      <strong>Areas for improvement:</strong> Focus on {Object.keys(dashboardData?.weak_topics || {}).slice(0, 2).join(' and ') || 'key areas'} to enhance your results.
                    </p>
                    <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Last updated: {dashboardData?.insight_last_updated ? new Date(dashboardData.insight_last_updated).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(dashboardData?.weak_topics || {}).map((topic, index) => (
                      <span 
                        key={`topic-${index}`}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tabs for different charts */}
                <div className="lg:col-span-3">
                  <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                    <nav className="flex space-x-8 -mb-px">
                      {[
                        { id: "performance", label: "Performance", icon: TrendingUp },
                        { id: "topics", label: "Weak Topics", icon: Target },
                        { id: "mastery", label: "Mastery Level", icon: BookOpen },
                        { id: "schedule", label: "Schedule", icon: Calendar }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`
                            flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                            ${activeTab === tab.id 
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
                  
                  {/* Tab content */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
                    {activeTab === "performance" && (
                      <div className="animate-fade-in">
                  <h3 className="text-lg font-semibold mb-4">Performance Progression</h3>
                  {loading ? (
                    <div className="h-80 flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2 text-gray-600 dark:text-gray-300">Loading chart data...</span>
                    </div>
                  ) : performanceData.length === 0 ? (
                    <div className="h-80 flex justify-center items-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">No performance data available yet.</p>
                    </div>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip 
                            formatter={(value, name) => [
                              `${value}${name === 'score' ? '%' : ''}`, 
                              name === 'score' ? 'Score' : name === 'correct' ? 'Correct Answers' : 'Total Questions'
                            ]}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            name="Score"
                            stroke="#9b87f5" 
                            strokeWidth={2}
                            activeDot={{ r: 8 }} 
                          />
                          {/* Optional: Add lines for correct answers and total if needed */}
                          {/* <Line type="monotone" dataKey="correct" stroke="#4CAF50" strokeWidth={1} /> */}
                          {/* <Line type="monotone" dataKey="total" stroke="#FF9800" strokeWidth={1} /> */}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                    )}
                    
                    {activeTab === "topics" && (
                <div className="animate-fade-in">
                  <h3 className="text-lg font-semibold mb-4">Weak Topics Analysis</h3>
                  {loading ? (
                    <div className="h-80 flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2 text-gray-600 dark:text-gray-300">Loading topic data...</span>
                    </div>
                  ) : weakTopicsData.length === 0 ? (
                    <div className="h-80 flex justify-center items-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">No topic proficiency data available yet.</p>
                    </div>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weakTopicsData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Proficiency']} />
                          <Bar dataKey="score" name="Proficiency" radius={[10, 10, 0, 0]}>
                            {weakTopicsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                    )}
                    
                    {activeTab === "mastery" && (
                <div className="animate-fade-in">
                  <h3 className="text-lg font-semibold mb-4">Current Level of Mastery</h3>
                  {loading ? (
                    <div className="h-80 flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2 text-gray-600 dark:text-gray-300">Loading mastery data...</span>
                    </div>
                  ) : (
                    <div className="h-80 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                          cx="50%" 
                          cy="50%" 
                          innerRadius="30%" 
                          outerRadius="80%" 
                          barSize={20} 
                          data={masteryData} 
                          startAngle={90} 
                          endAngle={-270}
                        >
                          <RadialBar
                            background
                            dataKey="value"
                            cornerRadius={10}
                            fill="#9b87f5"
                          />
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-bold text-2xl"
                            fill="#333333"
                          >
                            {masteryData[0]?.value || 0}%
                          </text>
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                    )}
                    
                    {activeTab === "schedule" && (
                <div className="animate-fade-in">
                  <h3 className="text-lg font-semibold mb-4">Study Schedule</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Your AI-optimized study schedule based on performance analytics:
                  </p>
                  
                  {loading ? (
                    <div className="h-60 flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2 text-gray-600 dark:text-gray-300">Loading schedule...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData?.weak_topics && Object.keys(dashboardData.weak_topics).length > 0 ? (
                        // Generate schedule based on weak topics
                        [
                          { 
                            day: "Monday", 
                            subjects: [Object.keys(dashboardData.weak_topics)[0], Object.keys(dashboardData.weak_topics).length > 1 ? Object.keys(dashboardData.weak_topics)[1] : "Review"], 
                            duration: "1.5 hours" 
                          },
                          { 
                            day: "Wednesday", 
                            subjects: [
                              `${Object.keys(dashboardData.weak_topics)[0]} Practice`, 
                              Object.keys(dashboardData.weak_topics).length > 1 ? `${Object.keys(dashboardData.weak_topics)[1]} Exercises` : "Problem Solving"
                            ], 
                            duration: "2 hours" 
                          },
                          { 
                            day: "Friday", 
                            subjects: [
                              `${Object.keys(dashboardData.weak_topics)[0]} Review`, 
                              "Assessment Preparation"
                            ], 
                            duration: "1 hour" 
                          }
                        ].map((schedule, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">{schedule.day}</h4>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                  {schedule.subjects.join(" • ")}
                                </div>
                              </div>
                              <div className="text-sm font-medium text-gray-500">
                                {schedule.duration}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        // Fallback to default schedule
                        [
                          { day: "Monday", subjects: ["Algebra", "Physics"], duration: "1.5 hours" },
                          { day: "Wednesday", subjects: ["Physics Labs", "Equations"], duration: "2 hours" },
                          { day: "Friday", subjects: ["Algebra Review", "Problem Solving"], duration: "1 hour" }
                        ].map((schedule, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">{schedule.day}</h4>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                  {schedule.subjects.join(" • ")}
                                </div>
                              </div>
                              <div className="text-sm font-medium text-gray-500">
                                {schedule.duration}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
    </div>
  );
};

export default Dashboard;
