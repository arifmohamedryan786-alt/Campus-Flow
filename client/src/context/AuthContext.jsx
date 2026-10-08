import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('campusflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('campusflow_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          localStorage.setItem('campusflow_user', JSON.stringify(res.user));
        } catch (err) {
          console.error('Auth verification failed:', err);
          setUser(null);
          setToken(null);
          localStorage.removeItem('campusflow_token');
          localStorage.removeItem('campusflow_user');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    checkAuth();
  }, [token]);

  const login = async (identifier, password) => {
    const data = await api.login(identifier, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('campusflow_token', data.token);
    localStorage.setItem('campusflow_user', JSON.stringify(data.user));
    return data;
  };

  const logout = async () => {
    await api.logout();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('campusflow_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
