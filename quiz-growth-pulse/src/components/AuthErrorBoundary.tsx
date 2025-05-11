import React from 'react';

/**
 * Error boundary component specifically for catching authentication-related errors.
 * Provides a consistent error experience for auth failures across the application.
 */
export class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console
    console.error('Auth error boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI for auth errors
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-center">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Authentication Error</h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{this.state.errorMessage || 'An authentication error occurred.'}</p>
          <button 
            className="px-4 py-2 bg-primary text-white rounded-md"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
