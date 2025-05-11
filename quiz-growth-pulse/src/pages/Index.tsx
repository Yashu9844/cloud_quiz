"use client";
import { useState } from "react";
import LandingHero from "@/components/LandingHero";
import FeaturesSection from "@/components/FeaturesSection";
import QuizInterface from "@/components/QuizInterface";
import ResultPage from "@/components/ResultPage";
import Dashboard from "@/components/Dashboard";

// 🛑 Import your new modal
import SignInModal from "@/components/SignInModal"
import SignUpModal from "@/components/SignUpModal";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "@/components/ui/toast";
import { Link } from "react-router-dom";
const Index = ({ activeSection: initialSection = "landing" }) => {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [showModal, setShowModal] = useState(false); // 🛑 Manage modal state
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const { isAuthenticated, logout } = useAuth();
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
            timeTaken={120} // Adding the required timeTaken prop (in seconds, equivalent to 2 minutes)
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
      <main className="flex-1">
        {renderSection()}
      </main>

      {/* 🛑 Use the modal component here */}
      <SignInModal 
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onSwitchToSignUp={() => {
        setShowModal(false);
        setShowSignUpModal(true);
      }}
    />

    <SignUpModal
      isOpen={showSignUpModal}
      onClose={() => setShowSignUpModal(false)}
      onSwitchToSignIn={() => {
        setShowSignUpModal(false);
        setShowModal(true);
      }}
    />
    </div>
  );
};

export default Index;
