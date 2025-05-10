import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { showToast } from './ui/toast';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectPath?: string;
}

const ProtectedRoute = ({ 
  children, 
  redirectPath = '/login' 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, getToken } = useAuth();
  const location = useLocation();
  const [initialChecking, setInitialChecking] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    // Verify authentication status
    const verifyAuth = async () => {
      try {
        // Check if we have a valid token
        const token = getToken();
        
        // Set auth checked true regardless of result
        setAuthChecked(true);
        
        // No longer doing initial check
        setInitialChecking(false);
        
        // Show a message if not authenticated and not on the initial check
        if (!token && !isAuthenticated && !initialChecking) {
          showToast({
            message: 'Please sign in to access this page',
            type: 'warning',
            duration: 5000
          });
        }
      } catch (error) {
        // Handle any errors gracefully
        console.error('Auth verification error:', error);
        setAuthChecked(true);
        setInitialChecking(false);
      }
    };

    verifyAuth();
  }, [isAuthenticated, getToken, initialChecking]);

  // Show loading state while checking authentication
  if (isLoading || !authChecked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-gray-600 dark:text-gray-300">Verifying authentication...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Store the current path for redirection after login
    const returnPath = location.pathname + location.search;
    
    // Redirect to the login page with the return url
    return <Navigate to={redirectPath} state={{ from: returnPath, returnTo: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

