import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Book, LineChart, User, Menu, X, LogOut } from "lucide-react";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import { Dialog } from "@/components/ui/dialog";
import { showToast } from "@/components/ui/toast";

// Type for the user authentication state
interface AuthState {
  isAuthenticated: boolean;
  username?: string;
}

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({ 
    isAuthenticated: false 
  });
  
  const navigate = useNavigate();
  
  // Check authentication status on component mount and when token changes
  useEffect(() => {
    checkAuthStatus();
    
    // Add event listener for storage changes (to detect login/logout in other tabs)
    window.addEventListener('storage', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);
  
  // Function to check authentication status
  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    setAuthState({ 
      isAuthenticated: !!token,
      // You could decode the JWT token here to get the username if needed
    });
  };
  
  // Function to open sign out confirmation dialog
  const openSignOutDialog = () => {
    setIsSignOutDialogOpen(true);
  };

  // Function to handle sign out
  const handleSignOut = () => {
    // Close the dialog
    setIsSignOutDialogOpen(false);
    
    // Remove token and update state
    localStorage.removeItem('token');
    setAuthState({ isAuthenticated: false });
    
    // Provide better feedback using toast
    showToast({
      message: 'You have been signed out successfully',
      type: 'success',
      duration: 3000
    });
    
    // Redirect to home page
    navigate('/');
  };
  
  const toggleMenu = () => setIsOpen(!isOpen);
  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="lg:hidden fixed top-4 right-4 z-40 p-2 rounded-full bg-primary text-white shadow-md"
        onClick={toggleMenu}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      {/* Desktop sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 transform bg-white dark:bg-gray-900 w-64 overflow-y-auto transition-transform duration-300 ease-in-out z-30 shadow-lg",
        "lg:translate-x-0 lg:static lg:w-64 lg:min-h-screen",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <Link to="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
            <div className="bg-primary rounded-lg p-2">
              <LineChart className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight font-poppins">GrowthPulseee</span>
          </Link>
        </div>
        
        <nav className="px-4 py-4">
          <ul className="space-y-2">
            {[
              { name: "Home", path: "/", icon: Home },
              { name: "Quizzes", path: "/quiz", icon: Book },
              { name: "Dashboard", path: "/dashboard", icon: LineChart },
              { name: "Profile", path: "/profile", icon: User }
            ].map(item => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3 text-primary" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          <div className="bg-card-gradient glass-card p-4 rounded-lg shadow-sm">
            <h4 className="font-medium mb-2">Need help?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">Get support with your quizzes and learning journey</p>
            <button className="mt-3 w-full btn-outline text-sm py-1.5">Contact Support</button>
          </div>
          
          {/* Authentication Button */}
          {authState.isAuthenticated ? (
            <button
              onClick={openSignOutDialog}
              className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition flex items-center justify-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setIsSignInOpen(true)}
                className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUpOpen(true)}
                className="w-full border border-primary text-primary py-2 rounded-md hover:bg-primary/10 transition"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={toggleMenu}
        />
      )}

      {/* Authentication Modals */}
      <SignInModal 
        isOpen={isSignInOpen} 
        onClose={() => {
          setIsSignInOpen(false);
          checkAuthStatus(); // Check auth status when modal closes
        }}
        onSwitchToSignUp={() => {
          setIsSignInOpen(false);
          setIsSignUpOpen(true);
        }}
      />
      
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => {
          setIsSignUpOpen(false);
          checkAuthStatus(); // Check auth status when modal closes
        }}
        onSwitchToSignIn={() => {
          setIsSignUpOpen(false);
          setIsSignInOpen(true);
        }}
      />
      
      {/* Sign Out Confirmation Dialog */}
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
    </>
  );
};

export default Navigation;
