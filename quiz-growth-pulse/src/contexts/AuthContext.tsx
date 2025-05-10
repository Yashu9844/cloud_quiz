import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'user';

// Define JWT token structure
interface JwtPayload {
  id: string;
  exp: number;
  iat: number;
}

// User interface to type-check user data
export interface User {
  id: string;
  username: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getToken: () => string | null;
  getCurrentUser: () => User | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  getToken: () => null,
  getCurrentUser: () => null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  /**
   * Helper function to validate the authentication state
   * Checks if token is valid and user data is consistent
   * @returns boolean indicating if auth state is valid
   */
  const validateAuthState = useCallback((tokenValue: string | null, userData: User | null): boolean => {
    // No token means invalid auth state
    if (!tokenValue) {
      console.log('Auth validation: No token found');
      return false;
    }
    
    try {
      // Check if token is expired
      const decodedToken = jwtDecode<JwtPayload>(tokenValue);
      const currentTime = Date.now() / 1000;
      
      if (decodedToken.exp < currentTime) {
        console.warn('Auth validation: Token expired');
        return false;
      }
      
      // If we have a valid token but no user data, auth state is inconsistent
      if (!userData) {
        console.warn('Auth validation: Token valid but no user data');
        return false;
      }
      
      // Check if user ID in token matches user data
      if (decodedToken.id !== userData.id) {
        console.warn('Auth validation: User ID mismatch between token and user data');
        return false;
      }
      
      // Validate user data structure
      if (!userData.id || !userData.username || !userData.email) {
        console.warn('Auth validation: Invalid user data structure');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Auth validation: Error validating token:', error);
      return false;
    }
  }, []);
  
  /**
   * Clear all authentication state
   */
  const clearAuthState = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log('Auth state cleared');
  }, []);

  // Check for token and user data on initial load
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUserData = localStorage.getItem(USER_KEY);
      
      // Parse user data if it exists
      let parsedUserData: User | null = null;
      if (storedUserData) {
        try {
          parsedUserData = JSON.parse(storedUserData) as User;
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          // Will be handled by validateAuthState
        }
      }
      
      // Validate the authentication state
      if (validateAuthState(storedToken, parsedUserData)) {
        // Valid auth state, update context state
        setToken(storedToken);
        setUser(parsedUserData);
        setIsAuthenticated(true);
        console.log('Auth initialized: Valid authentication state found');
      } else {
        // Invalid auth state, clear everything
        console.warn('Auth initialized: Invalid authentication state, clearing data');
        clearAuthState();
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  }, [validateAuthState, clearAuthState]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('Attempting login for:', email);
      
      const data = await authApi.login(email, password);
      
      if (data.token) {
        // Store the token and update auth state
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setIsAuthenticated(true);
        
        // Store user data if available
        if (data.user) {
          const userData: User = {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at
          };
          
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
          setUser(userData);
          console.log('Login successful, token and user data stored');
        } else {
          console.warn('Login response missing user data');
        }
        
        return true;
      } else {
        console.error('Login response missing token');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('Attempting registration for:', username, email);
      
      const data = await authApi.register(username, email, password);
      console.log('Registration successful');
      
      // Auto login if token is provided with registration
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setIsAuthenticated(true);
        
        // Store user data if available
        if (data.user) {
          const userData: User = {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at
          };
          
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
          setUser(userData);
          console.log('Auto login after registration with user data');
        } else {
          console.warn('Registration response missing user data');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    setIsLoading(true);
    clearAuthState();
    console.log('Logged out - token and user data removed');
    setIsLoading(false);
  }, [clearAuthState]);
  const getToken = useCallback(() => {
    // First try from state, then from localStorage
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    
    if (!currentToken) {
      console.log('No token available');
      return null;
    }
    
    // Optionally validate token expiration
    try {
      const decodedToken = jwtDecode<JwtPayload>(currentToken);
      const currentTime = Date.now() / 1000;
      
      if (decodedToken.exp < currentTime) {
        console.warn('Token expired, clearing auth state');
        clearAuthState();
        return null;
      }
    } catch (error) {
      console.error('Error validating token in getToken:', error);
      clearAuthState();
      return null;
    }
    
    return currentToken;
  }, [token, clearAuthState]);

  const getCurrentUser = useCallback((): User | null => {
    // Check if we have a valid token first
    const currentToken = getToken();
    if (!currentToken) {
      console.log('getCurrentUser: No valid token, cannot get user');
      return null;
    }
    
    // Return from state if available
    if (user) {
      return user;
    }
    
    // Try to get from localStorage
    const storedUserData = localStorage.getItem(USER_KEY);
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData) as User;
        
        // Validate user data structure
        if (!userData.id || !userData.username || !userData.email) {
          console.warn('getCurrentUser: Invalid user data structure, clearing auth state');
          clearAuthState();
          return null;
        }
        
        // Update state with data from storage for consistency
        setUser(userData);
        return userData;
      } catch (error) {
        console.error('Failed to parse user data from storage:', error);
        clearAuthState();
        return null;
      }
    }
    
    // If we have a token but no user data, we're in an inconsistent state
    console.warn('getCurrentUser: Token exists but no user data found, clearing auth state');
    clearAuthState();
    return null;
  }, [user, getToken, clearAuthState]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated,
      isLoading, 
      user,
      login, 
      register, 
      logout, 
      getToken,
      getCurrentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


