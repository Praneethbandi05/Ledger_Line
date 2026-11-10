import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ledgerline_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('ledgerline_user');
    const savedToken = localStorage.getItem('ledgerline_token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('ledgerline_user');
        localStorage.removeItem('ledgerline_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token: jwtToken, user: userProfile } = response.data.data;

    localStorage.setItem('ledgerline_token', jwtToken);
    localStorage.setItem('ledgerline_user', JSON.stringify(userProfile));

    setToken(jwtToken);
    setUser(userProfile);
    return userProfile;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { token: jwtToken, user: userProfile } = response.data.data;

    localStorage.setItem('ledgerline_token', jwtToken);
    localStorage.setItem('ledgerline_user', JSON.stringify(userProfile));

    setToken(jwtToken);
    setUser(userProfile);
    return userProfile;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  };

  const updateProfile = async (fullName, email) => {
    const response = await api.put('/auth/profile', { fullName, email });
    const updatedUser = response.data.data;
    localStorage.setItem('ledgerline_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('ledgerline_token');
      localStorage.removeItem('ledgerline_user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        role: user?.role,
        login,
        register,
        changePassword,
        updateProfile,
        logout,
      }}
    >
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
