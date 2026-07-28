import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('smartgov_token');
    const savedUser = localStorage.getItem('smartgov_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('smartgov_user');
      }
    }
    setLoading(false);
  }, []);

  const loginEmployee = async (username, password) => {
    const res = await authAPI.employeeLogin({ username, password });
    const { token, employee } = res.data.data;
    localStorage.setItem('smartgov_token', token);
    localStorage.setItem('smartgov_user', JSON.stringify({ ...employee, type: 'employee' }));
    setUser({ ...employee, type: 'employee' });
    return employee;
  };

  const loginAdmin = async (username, password) => {
    const res = await authAPI.adminLogin({ username, password });
    const { token, admin } = res.data.data;
    localStorage.setItem('smartgov_token', token);
    localStorage.setItem('smartgov_user', JSON.stringify({ ...admin, type: 'admin' }));
    setUser({ ...admin, type: 'admin' });
    return admin;
  };

  const logout = () => {
    localStorage.removeItem('smartgov_token');
    localStorage.removeItem('smartgov_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginEmployee, loginAdmin, logout, isEmployee: user?.type === 'employee', isAdmin: user?.type === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
