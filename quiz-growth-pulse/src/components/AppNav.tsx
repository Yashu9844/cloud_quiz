import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  BookOpen, 
  BarChart2, 
  User, 
  LogOut, 
  Menu, 
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog } from "@/components/ui/dialog";
import { showToast } from "@/components/ui/toast";

export const AppNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const handleSignOut = () => {
    setIsSignOutDialogOpen(false);
    logout();
    showToast({
      message: 'You have been signed out successfully',
      type: 'success',
      duration: 3000
    });
    navigate('/');
  };

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Quiz", icon: BookOpen, path: "/quiz" },
    { label: "Dashboard", icon: BarChart2, path: "/dashboard" },
    { label: "Statistics", icon: BarChart2, path: "/quiz-stats" }
  ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="bg-primary p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline-block">
              GrowthPulse
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${isActivePath(item.path)
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'}
                `}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </button>
            ))}
            
            {isAuthenticated && (
              <button
                onClick={() => setIsSignOutDialogOpen(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className={`
                    flex items-center px-4 py-2 rounded-lg text-sm font-medium w-full transition-colors
                    ${isActivePath(item.path)
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'}
                  `}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </button>
              ))}
              
              {isAuthenticated && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsSignOutDialogOpen(true);
                  }}
                  className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Sign Out Dialog */}
      <Dialog
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        isOpen={isSignOutDialogOpen}
        onConfirm={handleSignOut}
        onCancel={() => setIsSignOutDialogOpen(false)}
        confirmText="Sign Out"
        cancelText="Cancel"
        type="warning"
      />
    </header>
  );
}

