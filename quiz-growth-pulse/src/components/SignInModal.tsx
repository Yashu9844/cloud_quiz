import { useState, FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
}

interface AuthResponse {
  message?: string;
  token?: string;
  error?: string;
}

export default function SignInModal({ isOpen, onClose, onSwitchToSignUp }: SignInModalProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { login } = useAuth();

  // Email validation function
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset error message
    setErrorMessage("");
    
    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setErrorMessage(emailError);
      return;
    }

    // Validate password is not empty
    if (!password.trim()) {
      setErrorMessage("Password is required");
      return;
    }
    
    // Set loading state
    setIsLoading(true);
    
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      // Parse response carefully
      let data: AuthResponse = {};
      try {
        const text = await res.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        setErrorMessage("Server returned an invalid response");
        setIsLoading(false);
        return;
      }
      
      if (res.ok) {
        // Use the login function from AuthContext
        if (data.token) {
          login(data.token);
          console.log("Token stored successfully");
          
          // Close modal and provide success feedback
          onClose();
          
          // You could redirect to dashboard or refresh the page here
          // window.location.href = "/dashboard";
        } else {
          setErrorMessage("Login successful but no authentication token received");
        }
      } else {
        // Display specific error message from server
        setErrorMessage(data.message || data.error || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-lg relative">
        
        {/* Close (X) Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center">Sign In</h2>

        <form onSubmit={handleSignIn}>
          {/* Error message display */}
          {errorMessage && (
            <div className="p-3 mb-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
              {errorMessage}
            </div>
          )}
          
          <input
            className="w-full p-2 mb-3 border rounded"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            aria-label="Email"
          />
          <input
            className="w-full p-2 mb-4 border rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            aria-label="Password"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        
        {/* Forgot Password Link */}
        <div className="mt-2 text-center">
          <button className="text-sm text-blue-500 hover:underline">
            Forgot Password?
          </button>
        </div>

        {/* Switch to Sign Up */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={onSwitchToSignUp}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
