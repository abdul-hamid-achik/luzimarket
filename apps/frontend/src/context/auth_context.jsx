import React, { createContext, useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import { loginUser, registerUser } from "import../";

export const AuthContext = createContext({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch {
        sessionStorage.removeItem('token');
      }
    }
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