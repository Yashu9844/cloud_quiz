import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '@/contexts/AuthContext';

const AuthTest = () => {
  const { login, logout, isAuthenticated } = useAuth();
  const [testMessage, setTestMessage] = useState('');
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  useEffect(() => {
    const testAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        console.log('Current token:', token);
        
        // Test API endpoint configuration
        const apiUrl = import.meta.env.VITE_API_URL;
        console.log('API URL:', apiUrl);
        
        setDebugInfo({
          apiUrl,
          hasToken: !!token,
          isAuthenticated,
          timestamp: new Date().toISOString()
        });
        
        if (token) {
          try {
            const decoded: any = jwtDecode(token);
            const expirationTime = new Date(decoded.exp * 1000);
            const now = new Date();
            
            setTokenInfo({
              isExpired: expirationTime < now,
              expiresAt: expirationTime.toLocaleString(),
              userId: decoded.id,
              tokenData: decoded
            });
            
            console.log('Token details:', {
              expiresAt: expirationTime,
              userId: decoded.id,
              isExpired: expirationTime < now,
              fullToken: decoded
            });
          } catch (e) {
            console.error('Failed to decode token:', e);
            setTokenInfo({ error: 'Invalid token format' });
          }
        }
        
        if (token) {
          try {
            const response = await api.get('/quiz-attempts');
            console.log('Auth test successful:', response.data);
            setTestMessage('Authentication working correctly');
            
            setDebugInfo(prev => ({
              ...prev,
              authTest: 'passed',
              responseStatus: response.status
            }));
          } catch (error: any) {
            console.error('Detailed request error:', {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              headers: error.response?.headers
            });
            
            setDebugInfo(prev => ({
              ...prev,
              authTest: 'failed',
              errorStatus: error.response?.status,
              errorMessage: error.message
            }));
            
            if (error.response?.status === 401) {
              setTestMessage('Not authenticated. Please log in again.');
            } else if (error.response?.status === 403) {
              setTestMessage('Session expired. Please log in again.');
            } else {
              setTestMessage(`Auth error: ${error.message}`);
            }
            
            // Clear token if it exists but is invalid
            if (localStorage.getItem('authToken') && (error.response?.status === 401 || error.response?.status === 403)) {
              localStorage.removeItem('authToken');
            }
          }
        }
      } catch (error: any) {
        console.error('General error:', error);
        setTestMessage(`Error: ${error.message}`);
      }
    };
    
    testAuth();
  }, [isAuthenticated]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestMessage('Attempting login...');
    setDebugInfo(prev => ({
      ...prev,
      loginAttempt: {
        timestamp: new Date().toISOString(),
        email
      }
    }));

    try {
      console.log('Starting login process with email:', email);
      const success = await login(email, password);
      
      if (success) {
        const token = localStorage.getItem('authToken');
        console.log('Login successful, token received:', token ? `${token.substring(0, 20)}...` : 'No token');
        
        setTestMessage('Login successful! Verifying token...');
        
          try {
            const decoded: any = jwtDecode(token!);
            console.log('Token decoded:', {
            userId: decoded.id,
            email: decoded.email,
            username: decoded.username,
            exp: new Date(decoded.exp * 1000).toLocaleString()
          });
          
          setDebugInfo(prev => ({
            ...prev,
            loginStatus: 'success',
            tokenInfo: {
              userId: decoded.id,
              email: decoded.email,
              expiresAt: new Date(decoded.exp * 1000).toLocaleString()
            }
          }));
          
          // Verify token with backend
          try {
            const verifyResponse = await api.get('/quiz-attempts');
            console.log('Token verification successful:', verifyResponse.data);
            
            setTestMessage('Login and token verification successful!');
            setDebugInfo(prev => ({
              ...prev,
              tokenVerification: {
                status: 'success',
                timestamp: new Date().toISOString()
              }
            }));
          } catch (verifyError: any) {
            console.error('Token verification failed:', verifyError);
            setTestMessage(`Login successful but token verification failed: ${verifyError.message}`);
            setDebugInfo(prev => ({
              ...prev,
              tokenVerification: {
                status: 'failed',
                error: verifyError.message,
                statusCode: verifyError.response?.status,
                timestamp: new Date().toISOString()
              }
            }));
          }
        } catch (decodeError) {
          console.error('Token decode error:', decodeError);
          setTestMessage('Login successful but token is invalid');
          setDebugInfo(prev => ({
            ...prev,
            tokenDecodeError: decodeError.message
          }));
        }
      } else {
        setTestMessage('Login failed - Invalid credentials');
        setDebugInfo(prev => ({
          ...prev,
          loginStatus: 'failed',
          error: 'Invalid credentials'
        }));
      }
    } catch (error: any) {
      console.error('Login attempt failed:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setTestMessage(`Login error: ${errorMessage}`);
      setDebugInfo(prev => ({
        ...prev,
        loginError: {
          message: errorMessage,
          status: error.response?.status,
          timestamp: new Date().toISOString()
        }
      }));
    }
  };
  
  const handleCompleteReset = () => {
    // Clear all auth-related data
    localStorage.removeItem('authToken');
    setEmail('');
    setPassword('');
    setTokenInfo(null);
    setDebugInfo(null);
    setTestMessage('All auth data cleared. Please log in again.');
    
    // Force logout through context
    logout();
  };
  
  const handleTestDashboard = async () => {
    setTestMessage('Testing dashboard access...');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setTestMessage('No auth token found. Please log in first.');
        return;
      }

      // Try to decode token
      try {
        const decoded: any = jwtDecode(token);
        const expirationTime = new Date(decoded.exp * 1000);
        const now = new Date();
        
        setDebugInfo(prev => ({
          ...prev,
          tokenDebug: {
            expiresAt: expirationTime.toISOString(),
            isExpired: expirationTime < now,
            userId: decoded.id,
            email: decoded.email
          }
        }));

        if (expirationTime < now) {
          setTestMessage('Token is expired. Please log in again.');
          return;
        }
      } catch (decodeError) {
        setTestMessage('Invalid token format. Please log in again.');
        return;
      }

      // Test dashboard endpoint
      const response = await api.get('/quiz-attempts/analytics/dashboard');
      console.log('Dashboard test response:', response.data);
      
      setTestMessage('Dashboard access successful!');
      setDebugInfo(prev => ({
        ...prev,
        dashboardTest: {
          success: true,
          timestamp: new Date().toISOString(),
          dataReceived: !!response.data
        }
      }));
    } catch (error: any) {
      console.error('Dashboard test failed:', error);
      setTestMessage(`Dashboard test failed: ${error.message}`);
      setDebugInfo(prev => ({
        ...prev,
        dashboardTest: {
          success: false,
          error: error.message,
          status: error.status,
          timestamp: new Date().toISOString()
        }
      }));
    }
  };
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold mb-2">Authentication Status</h3>
      <p className="mb-2">{testMessage || 'Testing authentication...'}</p>
      
      <div className="mb-4">
        <button
          onClick={handleCompleteReset}
          className="w-full bg-yellow-500 text-white p-2 rounded mb-2"
        >
          Clear All Auth Data
        </button>
      </div>
      
      {!isAuthenticated ? (
        <form onSubmit={handleLogin} className="mb-4">
          <div className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-2 border rounded"
            />
            <button type="submit" className="w-full bg-primary text-white p-2 rounded">
              Login
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={logout}
          className="w-full bg-red-500 text-white p-2 rounded mb-4"
        >
          Logout
        </button>
      )}
      
      {isAuthenticated && (
        <button
          onClick={handleTestDashboard}
          className="w-full bg-blue-500 text-white p-2 rounded mb-4"
        >
          Test Dashboard Access
        </button>
      )}
      
      {tokenInfo && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          {tokenInfo.error ? (
            <p>Token Error: {tokenInfo.error}</p>
          ) : (
            <>
              <p>Token expires: {tokenInfo.expiresAt}</p>
              <p>Token status: {tokenInfo.isExpired ? 'Expired' : 'Valid'}</p>
              <p>User ID: {tokenInfo.userId}</p>
            </>
          )}
        </div>
      )}
      {debugInfo && (
        <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
          <h4 className="font-semibold mb-2">Debug Information</h4>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuthTest;

