import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Route,
  Routes
} from "react-router-dom";
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from './components/ui/toast';
import { AuthProvider } from './contexts/AuthContext';

// Pages and Components
import Dashboard from "./components/Dashboard";
import DashboardRoute from "./components/DashboardRoute";
import QuizDashboard from "./components/QuizDashboard";
import QuizInterface from "./components/QuizInterface";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Results from "./pages/Results";

// Styles
import './App.css';
import './styles.css'; // Quiz-specific styles

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Main App component that sets up:
 * - React Query for data fetching
 * - Toast notifications
 * - Routing with protected routes
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        {/* Global Toast Container */}
        <ToastContainer />
        
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/quiz" element={<QuizInterface />} />
            <Route path="/results" element={<Results />} />
            
            {/* Protected Routes - Require Authentication */}
            <Route 
              path="/dashboard" 
              element={<DashboardRoute />} 
            />
            
            <Route 
              path="/dashboard/quiz-stats" 
              element={
                <ProtectedRoute>
                  <QuizDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Index activeSection="profile" />
                </ProtectedRoute>
              } 
            />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
