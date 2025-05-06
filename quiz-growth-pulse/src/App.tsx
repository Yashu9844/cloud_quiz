import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer, showToast } from './components/ui/toast';
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

// Pages and Components
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Results from "./pages/Results";
import QuizInterface from "./components/QuizInterface";
import Dashboard from "./components/Dashboard";

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
        
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/quiz" element={<QuizInterface />} />
          <Route path="/results" element={<Results />} />
          
          {/* Protected Routes - Require Authentication */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
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
