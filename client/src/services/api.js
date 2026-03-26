// client/src/services/api.js
import axios from 'axios';

import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.token) {
      config.headers['x-auth-token'] = user.token;
      console.log('🔑 Token added to request');
    } else {
      console.log('⚠️ No token found in localStorage');
    }
    console.log('🌐 Connecting to:', config.baseURL + config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error Details:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });

    if (error.response?.status === 401 && error.config?.headers['x-auth-token']) {
      console.log('🔐 Unauthorized - Token expired or invalid. Logging out.');
      // Dispatch logout action to clear state and localStorage
      if (store) {
        store.dispatch(logout());
      }

      // Only redirect if we aren't already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (!error.response) {
      return Promise.reject({
        message: 'Network error: Cannot reach the backend server. Please check your internet connection or try again in a moment.'
      });
    }
    return Promise.reject(error.response.data);
  }
);

export default api;