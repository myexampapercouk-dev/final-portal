import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  function saveSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  }

  // Returns either { done: true, user } for teacher/admin (or if OTP isn't
  // required), or { done: false, requiresOtp: true, email, devOtp?, message }
  // for a parent account, which still needs verifyLoginOtp() to complete.
  async function loginRequest(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.token) {
      saveSession(data.token, data.user);
      return { done: true, user: data.user };
    }
    return {
      done: false,
      requiresOtp: true,
      email: data.email,
      devOtp: data.devOtp,
      message: data.message
    };
  }

  async function verifyLoginOtp(email, otp) {
    const { data } = await api.post('/auth/login/verify-otp', { email, otp });
    saveSession(data.token, data.user);
    return data.user;
  }

  async function registerParent(payload) {
    const { data } = await api.post('/auth/parent/register', payload);
    saveSession(data.token, data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loginRequest, verifyLoginOtp, registerParent, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}