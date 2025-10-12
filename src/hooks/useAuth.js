import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * useAuth Hook
 *
 * Custom hook to access the authentication context.
 * Provides easy access to auth state and functions throughout the app.
 *
 * @returns {Object} Authentication context value
 * @property {boolean} isLoggedIn - Whether the user is authenticated
 * @property {string|null} userId - The current user's ID
 * @property {string|null} userToken - The current user's auth token
 * @property {boolean} isLoading - Whether auth state is being checked
 * @property {Function} login - Function to login user
 * @property {Function} logout - Function to logout user
 * @property {Function} checkAuth - Function to manually check auth status
 *
 * @example
 * const { isLoggedIn, login, logout } = useAuth();
 *
 * // Check if user is logged in
 * if (isLoggedIn) {
 *   console.log('User is authenticated');
 * }
 *
 * // Login user
 * await login(userId, userToken);
 *
 * // Logout user
 * await logout();
 */
const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default useAuth;
