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
import { Layout } from './components/Layout';

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
            {/* Public Routes - All wrapped with Layout */}
            <Route path="/" element={<Layout><Index /></Layout>} />
            
            {/* Protected Routes - All wrapped with Layout */}
            <Route 
              path="/quiz" 
              element={
                <Layout>
                  <ProtectedRoute>
                    <QuizInterface />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/results" 
              element={
                <Layout>
                  <ProtectedRoute>
                    <Results />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <Layout>
                  <DashboardRoute />
                </Layout>
              } 
            />
            
            <Route 
              path="/dashboard/quiz-stats" 
              element={
                <Layout>
                  <ProtectedRoute>
                    <QuizDashboard />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <Layout>
                  <ProtectedRoute>
                    <Index activeSection="profile" />
                  </ProtectedRoute>
                </Layout>
              } 
            />
            
            {/* Add route for individual result details */}
            <Route 
              path="/results/:id" 
              element={
                <Layout>
                  <ProtectedRoute>
                    <Results />
                  </ProtectedRoute>
                </Layout>
              } 
            />

            {/* 404 Route */}
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
