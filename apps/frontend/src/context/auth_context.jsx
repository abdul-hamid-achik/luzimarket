import { createContext, useState, useEffect } from "react";
import jwtDecode from 'jwt-decode';
import { loginUser, registerUser } from "@/api/auth";
import api from "@/api/client";

export const AuthContext = createContext({
  user: null,
  login: async () => { },
  register: async () => { },
  logout: () => { },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Initialize authentication: use existing token or fetch a guest token
    const initAuth = async () => {
      let token = sessionStorage.getItem('token');
      if (!token) {
        try {
          const res = await api.post('/auth/guest');
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
        } catch {
          sessionStorage.removeItem('token');
        }
      }
    };
    initAuth();
  }, []);

  const login = async ({ email, password }) => {
    try {
      const result = await loginUser({ email, password });
      console.log('loginUser result:', result);
      const { jwt, user } = result;
      if (!jwt) {
        throw new Error('No JWT returned from backend');
      }
      sessionStorage.setItem('token', jwt);
      const decoded = jwtDecode(jwt);
      setUser(decoded);
      return result;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const register = async ({ email, password }) => {
    try {
      const result = await registerUser({ email, password });
      console.log('registerUser result:', result);
      const { jwt, user } = result;
      if (!jwt) {
        throw new Error('No JWT returned from backend');
      }
      sessionStorage.setItem('token', jwt);
      const decoded = jwtDecode(jwt);
      setUser(decoded);
      return result;
    } catch (err) {
      console.error('Register error:', err);
      throw err;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );

};