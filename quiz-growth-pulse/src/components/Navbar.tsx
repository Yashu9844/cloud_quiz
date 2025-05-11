import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Home, BarChart2, BookOpen, FileText, BrainCircuit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SignInModal from '@/components/SignInModal';
import SignUpModal from '@/components/SignUpModal';
import { showToast } from './ui/toast';

/**
 * Main navigation component for the Quiz Growth Pulse application
 */
const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  // Navigation items
  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Dashboard', path: '/dashboard', icon: BarChart2 },
    { label: 'Quiz', path: '/quiz', icon: BookOpen },
    { label: 'Results', path: '/results', icon: FileText },
  ];

  // Toggle mobile menu
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Handle logout with feedback
  const handleLogout = () => {
    logout();
    showToast({
      message: 'You have been logged out successfully',
      type: 'info',
      duration: 3000
    });
    setIsMenuOpen(false);
  };

  // Handle authentication modal switching
  const handleSwitchToSignUp = () => {
    setShowSignInModal(false);
    setShowSignUpModal(true);
  };

  const handleSwitchToSignIn = () => {
    setShowSignUpModal(false);
    setShowSignInModal(true);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="relative mr-2">
                <motion.div
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <BrainCircuit className="h-5 w-5 text-white" />
                </motion.div>
                {/* Pulse animation */}
                <motion.div 
                  className="absolute inset-0 rounded-lg bg-primary/20"
                  initial={{ opacity: 0.7, scale: 1 }}
                  animate={{ 
                    opacity: 0,
                    scale: 1.4,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Quiz Pulse
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                  Learning Upgraded
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5'
                    }`}
                >
                  <item.icon className="h-4 w-4 mr-1.5" />
                  {item.label}
                </Link>
              );
            })}

            {/* Auth Button */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="ml-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => setShowSignInModal(true)}
                className="ml-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu, shown/hidden based on menu state */}
      <motion.div 
        className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: isMenuOpen ? 1 : 0, 
          height: isMenuOpen ? 'auto' : 0 
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-100 dark:border-gray-700">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-2" />
                {item.label}
              </Link>
            );
          })}

          {/* Mobile Auth Button */}
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="w-full mt-2 flex items-center justify-center px-4 py-2 rounded-md text-base font-medium text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setShowSignInModal(true);
              }}
              className="w-full mt-2 flex items-center justify-center px-4 py-2 rounded-md text-base font-medium text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </motion.div>

      {/* Authentication Modals */}
      <SignInModal 
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSwitchToSignUp={handleSwitchToSignUp}
      />
      
      <SignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onSwitchToSignIn={handleSwitchToSignIn}
      />
    </nav>
  );
};

export default Navbar;

