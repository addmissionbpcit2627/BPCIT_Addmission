import React, { useState } from 'react';
import api from '../api/axios';
import { AuthContext } from './AuthContextInterface';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [role, setRole] = useState(() => localStorage.getItem('role') || null);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [loading] = useState(false);

  const login = async (identifier, password) => {
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      setToken(data.token);
      setRole(data.role);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, role: data.role };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, role, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
