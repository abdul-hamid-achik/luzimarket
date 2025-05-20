import { createContext, useState, useEffect, useContext } from "react";
import jwtDecode from 'jwt-decode';
import { loginUser, registerUser } from "@/api/auth";
import api from "@/api/client";
import { useMergeCart } from "@/api/hooks";

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
        let token = sessionStorage.getItem('token');
        if (!token) {
          try {
            const res = await api.post('/api/auth/guest');
            token = res.data.token;
            sessionStorage.setItem('token', token);
          } catch (err) {
            console.error('Failed to fetch guest token', err);
          }
        }

        if (token) {
          try {
            const decoded = jwtDecode(token);
            setUser(decoded);
            // Check if user has real authentication (not a guest token)
            setIsAuthenticated(decoded && !decoded.isGuest);
          } catch (error) {
            console.error('Failed to decode token', error);
            sessionStorage.removeItem('token');
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
      console.log('loginUser result:', result);

      // Extract token correctly - API returns { token } directly
      const { token } = result;
      if (!token) {
        throw new Error('No token returned from backend');
      }

      sessionStorage.setItem('token', token);
      const decoded = jwtDecode(token);
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
      console.log('registerUser result:', result);

      // Only set user and token if not skipping auto-login
      if (!skipAutoLogin) {
        const { token } = result;
        if (!token) {
          throw new Error('No token returned from backend');
        }
        sessionStorage.setItem('token', token);
        const decoded = jwtDecode(token);
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
    sessionStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};