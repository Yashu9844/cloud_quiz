"use client";

import { useState } from "react";

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignIn: () => void;
}

interface ApiResponse {
  message?: string;
  error?: string;
  userId?: string;
}

export default function SignUpModal({ isOpen, onClose, onSwitchToSignIn }: SignUpModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Add password validation
  const validatePassword = (password: string): string => {
    if (password.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    if (!/[!@#$%^&*]/.test(password)) return "Password must contain at least one special character";
    return "";
  };

  // Add email validation
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    
    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
  
      let data: ApiResponse = {};
      try {
        const text = await res.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        setError("Server returned an invalid response");
        setIsLoading(false);
        return;
      }
  
      if (res.ok) {
        // Success! Switch to sign in after registration
        onSwitchToSignIn(); 
      } else {
        setError(data.message || data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error occurred. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-96 shadow-lg relative">
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
        {error && (
          <div className="p-3 mb-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSignUp}>
          <input
            className="w-full p-2 mb-3 border rounded"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
            minLength={3}
          />
          <input
            className="w-full p-2 mb-3 border rounded"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <input
            className="w-full p-2 mb-2 border rounded"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={8}
          />
          <p className="text-xs text-gray-500 mb-4">
            Password must be at least 8 characters with uppercase, number, and special character.
          </p>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {/* Switch to Sign In */}
        <div className="text-center mt-4">
          <p className="text-sm">
            Already have an account?{" "}
            <button onClick={onSwitchToSignIn} className="text-blue-600 hover:underline">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
