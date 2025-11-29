// auth-context.js
import { createContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../utils/axios';
import { setSession, getPayload } from '../utils/jwt';

// ----------------------------------------------------------------------

const AuthContext = createContext({
  isAuthenticated: false,
  isInitialized: false,
  user: null,
  login: async () => {},
  logout: async () => {},
});

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ----------------------------------------------------------------------
  // Initialize auth state on app load
  useEffect(() => {
    const initialize = async () => {
      try {
        const accessToken = window.localStorage.getItem('accessToken');
        if (accessToken) {
          const payload = await getPayload(accessToken);
          if (payload) {
            setSession(accessToken);
            const response = await axiosInstance.get('/account/my-account');
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            setSession(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error(err);
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  // ----------------------------------------------------------------------
  const login = async (accessToken, userData) => {
    if (accessToken) {
      const payload = await getPayload(accessToken);
      if (payload) {
        setSession(accessToken);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.warn('Access token invalid at login');
      }
    }
  };

  const logout = async () => {
    setSession(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isInitialized,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};


