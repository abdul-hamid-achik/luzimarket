import { createContext, useState, useEffect, useContext } from "react";
import jwtDecode from 'jwt-decode';
import { loginUser, registerUser } from "@/api/auth";
import api from "@/api/client";
import { useMergeCart } from "@/api/hooks";
import { secureStorage } from "@/utils/storage";

export const AuthContext = createContext({
  user: null,
  login: async () => { },
  register: async () => { },
  logout: () => { },
  isAuthenticated: false,
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
  const mergeCart = useMergeCart();

  useEffect(() => {
    // Initialize authentication: use existing token or fetch a guest token
    const initAuth = async () => {
      setIsLoading(true);
      try {
        let accessToken = secureStorage.getAccessToken();
        if (!accessToken) {
          try {
            const res = await api.post('/auth/guest');
            accessToken = res.data.token; // Guest endpoint still returns 'token' field
            secureStorage.setAccessToken(accessToken);
          } catch (err) {
            console.error('Failed to fetch guest token', err);
          }
        }

        if (accessToken) {
          try {
            const decoded = jwtDecode(accessToken);
            setUser(decoded);
            // Check if user has real authentication (not a guest token)
            // Guest tokens have decoded.guest = true
            setIsAuthenticated(!!decoded && !decoded.guest);
          } catch (error) {
            console.error('Failed to decode token', error);
            secureStorage.clearTokens();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } finally {
        setIsLoading(false);
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

      // Merge guest cart with user cart using the hook
      try {
        await mergeCart.mutateAsync();
      } catch (error) {
        console.error('Failed to merge carts', error);
      }

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

        // Merge guest cart with user cart using the hook
        try {
          await mergeCart.mutateAsync();
        } catch (error) {
          console.error('Failed to merge carts', error);
        }
      }

      return result;
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    }
  };

  const logout = () => {
    secureStorage.clearTokens();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};