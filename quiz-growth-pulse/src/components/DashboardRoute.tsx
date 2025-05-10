import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/components/Dashboard';
import SignInModal from '@/components/SignInModal';
import { Loader2 } from 'lucide-react';
import { showToast } from './ui/toast';

/**
 * DashboardRoute component that conditionally renders the Dashboard or SignInModal
 * based on authentication state without page redirects
 */
const DashboardRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [returningFromLogin, setReturningFromLogin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we should show the sign-in modal based on auth state
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !showSignInModal) {
      setShowSignInModal(true);
    } else if (isAuthenticated && showSignInModal) {
      // Close the modal if the user becomes authenticated
      setShowSignInModal(false);
      
      // Show success message
      showToast({
        message: 'Successfully signed in. Loading your dashboard...',
        type: 'success',
        duration: 3000
      });
      
      // Mark that we just logged in successfully
      setReturningFromLogin(true);
    }
  }, [isAuthenticated, isLoading, showSignInModal]);

  // Handle successful login recovery logic
  useEffect(() => {
    if (returningFromLogin && isAuthenticated) {
      // Clear the returning flag
      setReturningFromLogin(false);
      
      // Now we can navigate to any pending path if needed
      const pendingPath = localStorage.getItem('pendingDashboardRedirect');
      if (pendingPath) {
        localStorage.removeItem('pendingDashboardRedirect');
        // If we have a pending path, navigate there
        navigate(pendingPath);
      }
    }
  }, [returningFromLogin, isAuthenticated, navigate]);

  // Handle modal close
  const handleCloseModal = () => {
    setShowSignInModal(false);
    navigate('/'); // Go back to home if they cancel
  };

  // Handle modal switch to sign up
  const handleSwitchToSignUp = () => {
    // This would show the sign up modal instead
    // For now, just keep the sign in modal open
    showToast({
      message: 'Please sign up to create an account',
      type: 'info',
      duration: 3000
    });
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      {/* Show the dashboard if authenticated */}
      {isAuthenticated && <Dashboard />}
      
      {/* Show the sign-in modal if not authenticated */}
      {showSignInModal && (
        <SignInModal
          isOpen={showSignInModal}
          onClose={handleCloseModal}
          onSwitchToSignUp={handleSwitchToSignUp}
        />
      )}
    </>
  );
};

export default DashboardRoute;

