
import { useState } from "react";
import Navigation from "@/components/Navigation";
import LandingHero from "@/components/LandingHero";
import FeaturesSection from "@/components/FeaturesSection";
import QuizInterface from "@/components/QuizInterface";
import ResultPage from "@/components/ResultPage";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [activeSection, setActiveSection] = useState("landing");
  
  // This would be connected to router in a real app
  const renderSection = () => {
    switch(activeSection) {
      case "quiz":
        return <QuizInterface />;
      case "results":
        return (
          <ResultPage 
            score={2} 
            totalQuestions={3} 
            onRetry={() => setActiveSection("quiz")} 
            onReview={() => alert("Review functionality would go here")} 
          />
        );
      case "dashboard":
        return <Dashboard />;
      case "landing":
      default:
        return (
          <>
            <LandingHero />
            <FeaturesSection />
            <div className="py-12 text-center">
              <p className="text-lg mb-6">Ready to get started?</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button 
                  className="btn-primary"
                  onClick={() => setActiveSection("quiz")}
                >
                  Try a Quiz
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setActiveSection("dashboard")}
                >
                  View Dashboard
                </button>
              </div>
            </div>
          </>
        );
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-900 shadow-sm z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-2">
              <span className="text-white font-bold text-xl">GP</span>
            </div>
            <span className="text-xl font-semibold hidden sm:inline-block">GrowthPulse</span>
          </div>
          
          <nav className="flex items-center space-x-6">
            <button 
              className={`text-sm font-medium ${activeSection === "landing" ? "text-primary" : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"}`}
              onClick={() => setActiveSection("landing")}
            >
              Home
            </button>
            <button 
              className={`text-sm font-medium ${activeSection === "quiz" ? "text-primary" : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"}`}
              onClick={() => setActiveSection("quiz")}
            >
              Quiz
            </button>
            <button 
              className={`text-sm font-medium ${activeSection === "dashboard" ? "text-primary" : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"}`}
              onClick={() => setActiveSection("dashboard")}
            >
              Dashboard
            </button>
            <button className="btn-outline text-sm py-1.5">
              Sign In
            </button>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {renderSection()}
      </main>
      
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2023 GrowthPulse. All rights reserved.</p>
            <p className="mt-2">An intelligent quiz platform for continuous learning.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
