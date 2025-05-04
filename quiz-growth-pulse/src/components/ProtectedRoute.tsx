import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { showToast } from './ui/toast';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectPath?: string;
}

const ProtectedRoute = ({ 
  children, 
  redirectPath = '/' 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show a message if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showToast({
        message: 'Please sign in to access this page',
        type: 'warning',
        duration: 5000
      });
    }
  }, [isAuthenticated, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    // Redirect to the login page with the return url
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

