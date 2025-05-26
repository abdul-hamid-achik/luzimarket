import { createContext, useState, useEffect, useContext } from "react";
import jwtDecode from 'jwt-decode';
import { loginUser, registerUser, restoreUserPreferences } from "@/api/auth";
import api from "@/api/client";
import { secureStorage } from "@/utils/storage";

export const AuthContext = createContext({
  user: null,
  login: async () => { },
  register: async () => { },
  logout: () => { },
  isAuthenticated: false,
  isLoading: false,
});

// Add useAuth hook to easily access the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize authentication: use existing token or fetch a guest token
    const initAuth = async () => {
      setIsLoading(true);
      try {
        let accessToken = secureStorage.getAccessToken();
        console.log('AuthProvider: Existing token found:', !!accessToken);

        if (!accessToken) {
          try {
            console.log('AuthProvider: Fetching guest token...');
            const res = await api.post('/auth/guest');
            accessToken = res.data.token; // Guest endpoint returns 'token' field
            secureStorage.setAccessToken(accessToken);
            console.log('AuthProvider: Guest token obtained successfully');
          } catch (err) {
            console.error('AuthProvider: Failed to fetch guest token', err);
            // Even if guest token fails, continue - some functionality might still work
          }
        }

        if (accessToken) {
          try {
            const decoded = jwtDecode(accessToken);
            console.log('AuthProvider: Token decoded:', {
              sessionId: decoded.sessionId,
              isGuest: decoded.isGuest,
              userId: decoded.userId
            });
            setUser(decoded);
            // Check if user has real authentication (not a guest token)
            // Guest tokens have decoded.isGuest = true
            setIsAuthenticated(!!decoded && !decoded.isGuest && !!decoded.userId);
          } catch (error) {
            console.error('AuthProvider: Failed to decode token', error);
            secureStorage.clearTokens();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('AuthProvider: Error during auth initialization:', error);
      } finally {
        setIsLoading(false);
        console.log('AuthProvider: Initialization complete');
      }
    };

    initAuth();
  }, []);

  const login = async ({ email, password }) => {
    try {
      const result = await loginUser({ email, password });

      // Extract both accessToken and refreshToken - API now returns accessToken
      const { accessToken, refreshToken } = result;
      if (!accessToken) {
        throw new Error('No access token returned from backend');
      }

      // Store tokens using secure storage
      secureStorage.setTokens({ accessToken, refreshToken });

      const decoded = jwtDecode(accessToken);
      setUser(decoded);
      setIsAuthenticated(true);

      // Restore user delivery preferences to their session
      try {
        await restoreUserPreferences();
        console.log('AuthProvider: User delivery preferences restored successfully');
      } catch (prefError) {
        // Don't fail login if preference restoration fails
        console.warn('AuthProvider: Failed to restore user preferences:', prefError);
      }

      // Note: Cart merging will be handled by components that import the cart merge hook
      // This avoids dependency issues with React Query in the context

      return result;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const register = async ({ email, password, skipAutoLogin = false }) => {
    try {
      const result = await registerUser({ email, password });

      // Only set user and token if not skipping auto-login
      if (!skipAutoLogin) {
        const { accessToken, refreshToken } = result;

        if (!accessToken) {
          throw new Error('No access token returned from backend');
        }

        // Store tokens using secure storage
        secureStorage.setTokens({ accessToken, refreshToken });

        const decoded = jwtDecode(accessToken);
        setUser(decoded);
        setIsAuthenticated(true);

        // Restore user delivery preferences to their session (for new users, there won't be any)
        try {
          await restoreUserPreferences();
          console.log('AuthProvider: User delivery preferences restored successfully');
        } catch (prefError) {
          // Don't fail registration if preference restoration fails (expected for new users)
          console.warn('AuthProvider: Failed to restore user preferences:', prefError);
        }

        // Note: Cart merging will be handled by components that import the cart merge hook
        // This avoids dependency issues with React Query in the context
      }

      return result;
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    }
  };

  const logout = async () => {
    console.log('AuthProvider: Logging out and fetching new guest token...');
    secureStorage.clearTokens();
    setUser(null);
    setIsAuthenticated(false);

    // Get a new guest token after logout
    try {
      const res = await api.post('/auth/guest');
      const guestToken = res.data.token;
      secureStorage.setAccessToken(guestToken);

      const decoded = jwtDecode(guestToken);
      setUser(decoded);
      console.log('AuthProvider: New guest token obtained after logout');
    } catch (error) {
      console.error('AuthProvider: Failed to get guest token after logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};