import React, { createContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';
import config from '../config/config';

/**
 * Authentication Context
 *
 * Provides global authentication state and functions throughout the app.
 * Use the useAuth hook to access this context in components.
 */

export const AuthContext = createContext({
  isLoggedIn: false,
  userId: null,
  userToken: null,
  pushTokenEndpoint: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  checkAuth: async () => {},
});

/**
 * Authentication Provider Component
 *
 * Wraps the app and provides authentication state to all children.
 * Automatically checks authentication status on mount.
 */
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [pushTokenEndpoint, setPushTokenEndpoint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check authentication status on app mount
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check if user is authenticated
   * Retrieves auth data from SecureStore and updates state
   */
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const authData = await authService.getAuthData();

      if (authData && authData.isLoggedIn) {
        setIsLoggedIn(true);
        setUserId(authData.userId);
        setUserToken(authData.userToken);
        setPushTokenEndpoint(authData.pushTokenEndpoint || null);

        if (config.DEBUG) {
          console.log('[AuthContext] User is authenticated:', authData.userId);
        }
      } else {
        setIsLoggedIn(false);
        setUserId(null);
        setUserToken(null);
        setPushTokenEndpoint(null);

        if (config.DEBUG) {
          console.log('[AuthContext] User is not authenticated');
        }
      }
    } catch (error) {
      console.error('[AuthContext] Error checking auth status:', error);
      setIsLoggedIn(false);
      setUserId(null);
      setUserToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user
   * Saves auth data to SecureStore and updates state
   *
   * @param {string} userId - The user's unique identifier
   * @param {string} userToken - The authentication token
   * @param {string} pushEndpoint - Optional push token endpoint URL
   * @returns {Promise<boolean>} Success status
   */
  const login = async (userId, userToken, pushEndpoint = null) => {
    try {
      const success = await authService.saveAuthData(userId, userToken, pushEndpoint);

      if (success) {
        setIsLoggedIn(true);
        setUserId(userId);
        setUserToken(userToken);
        setPushTokenEndpoint(pushEndpoint);

        if (config.DEBUG) {
          console.log('[AuthContext] User logged in:', userId);
          if (pushEndpoint) {
            console.log('[AuthContext] Push endpoint saved:', pushEndpoint);
          }
        }

        return true;
      } else {
        console.error('[AuthContext] Failed to save auth data');
        return false;
      }
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return false;
    }
  };

  /**
   * Logout user
   * Clears auth data from SecureStore and resets state
   *
   * @returns {Promise<boolean>} Success status
   */
  const logout = async () => {
    try {
      const success = await authService.clearAuthData();

      if (success) {
        setIsLoggedIn(false);
        setUserId(null);
        setUserToken(null);
        setPushTokenEndpoint(null);

        if (config.DEBUG) {
          console.log('[AuthContext] User logged out');
        }

        return true;
      } else {
        console.error('[AuthContext] Failed to clear auth data');
        return false;
      }
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      return false;
    }
  };

  const value = {
    isLoggedIn,
    userId,
    userToken,
    pushTokenEndpoint,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
