
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PieChart, Pie, Cell
} from "recharts";
import { TrendingUp, BookOpen, Target, Calendar, BrainCircuit, AlertCircle } from "lucide-react";

// Sample data for charts
const performanceData = [
  { date: "Jan", score: 65 },
  { date: "Feb", score: 59 },
  { date: "Mar", score: 72 },
  { date: "Apr", score: 68 },
  { date: "May", score: 75 },
  { date: "Jun", score: 82 }
];

const weakTopicsData = [
  { name: "Algebra", score: 45, fill: "#FF5252" },
  { name: "Physics", score: 52, fill: "#FF9800" },
  { name: "Chemistry", score: 78, fill: "#8BC34A" },
  { name: "Biology", score: 85, fill: "#4CAF50" }
];

const masteryData = [
  { name: "Mastery", value: 72, fill: "#9b87f5" }
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("performance");
  
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar is in the Navigation component already */}
        
        <motion.div 
          className="flex-1"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Learning Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track your progress and get AI-powered insights
            </p>
          </motion.div>
          
          {/* AI Insights Card */}
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-card mb-8 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-start mb-4">
              <div className="bg-primary/10 p-2 rounded-lg mr-4">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-1">AI-Driven Insights</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Based on your recent quiz performance</p>
              </div>
            </div>
            
            <div className="p-4 bg-card-gradient rounded-lg mb-4">
              <p className="text-gray-800 dark:text-gray-200">
                <strong>Improvement needed:</strong> You need improvement in Algebra and Physics. Focus on these subjects for better results.
              </p>
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                ML confidence score: 89%
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full">Algebra</span>
              <span className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full">Physics</span>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-3 py-1 rounded-full">Review Fundamentals</span>
            </div>
          </motion.div>
          
          {/* Tabs for different charts */}
          <motion.div variants={itemVariants}>
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-6 border border-gray-100 dark:border-gray-700">
              {activeTab === "performance" && (
                <div className="animate-fade-in">
                  <h3 className="text-lg font-semibold mb-4">Performance Progression</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#9b87f5" 
                          strokeWidth={2}
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {activeTab === "topics" && (
                <div className="animate-fade-in">
                  <h3 className="text-lg font-semibold mb-4">Weak Topics Analysis</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weakTopicsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="score" radius={[10, 10, 0, 0]}>
                          {weakTopicsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {activeTab === "mastery" && (
                <div className="animate-fade-in">
                  <h3 className="text-lg font-semibold mb-4">Current Level of Mastery</h3>
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
                          72%
                        </text>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {activeTab === "schedule" && (
                <div className="animate-fade-in">
                  <h3 className="text-lg font-semibold mb-4">Study Schedule</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Your AI-optimized study schedule based on performance analytics:
                  </p>
                  
                  <div className="space-y-4">
                    {[
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
