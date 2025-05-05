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
    const { token } = await loginUser({ email, password });
    sessionStorage.setItem('token', token);
    const decoded = jwtDecode(token);
    setUser(decoded);
  };

  const register = async ({ email, password }) => {
    await registerUser({ email, password });
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