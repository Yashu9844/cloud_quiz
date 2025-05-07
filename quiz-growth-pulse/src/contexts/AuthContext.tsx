import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api';

const TOKEN_KEY = 'authToken';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  getToken: () => null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);

  // Check for token on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      console.log('Auth initialized, token found');
    } else {
      console.log('Auth initialized, no token found');
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for:', email);
      
      const data = await authApi.login(email, password);
      
      if (data.token) {
        // Store the token and update auth state
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setIsAuthenticated(true);
        console.log('Login successful, token stored');
        return true;
      } else {
        console.error('Login response missing token');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting registration for:', username, email);
      
      const data = await authApi.register(username, email, password);
      console.log('Registration successful');
      
      // Auto login if token is provided with registration
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setIsAuthenticated(true);
        console.log('Auto login after registration');
      }
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setIsAuthenticated(false);
    console.log('Logged out - token removed');
  };

  const getToken = useCallback(() => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      console.log('No token available');
      return null;
    }
    return currentToken;
  }, [token]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


