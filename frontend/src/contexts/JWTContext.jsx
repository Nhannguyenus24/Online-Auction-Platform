// auth-context.js
import { createContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { setSession, getPayload } from '../utils/jwt';
import { authApi } from '../utils/api';

// ----------------------------------------------------------------------

export const AuthContext = createContext({
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
        console.log('Auth init - accessToken exists:', !!accessToken);
        
        if (accessToken) {
          // Set session first to ensure axios has the token
          setSession(accessToken);
          
          // Try to get profile from API first (most reliable)
          try {
            const response = await authApi.getProfile();
            console.log('Auth init - getProfile response:', response.data);
            
            if (response.data?.profile) {
              setUser(response.data.profile);
              setIsAuthenticated(true);
              console.log('Auth init - authenticated with profile:', response.data.profile);
            } else {
              // If response doesn't have profile, try to use token payload as fallback
              const payload = await getPayload(accessToken);
              if (payload) {
                const userData = {
                  id: payload.userId || payload.sub,
                  email: payload.email,
                  fullName: payload.fullName || payload.name,
                  roles: payload.roles || [payload.role],
                  roleName: payload.roleName || payload.role || payload.roles?.[0],
                };
                setUser(userData);
                setIsAuthenticated(true);
                console.log('Auth init - authenticated with payload:', userData);
              } else {
                // Token is invalid, clear it
                console.warn('Auth init - token invalid, clearing');
                setSession(null);
                setUser(null);
                setIsAuthenticated(false);
              }
            }
          } catch (profileError) {
            // If profile API fails, try to use token payload as fallback
            console.warn('Auth init - profile API failed, trying token payload:', profileError);
            const payload = await getPayload(accessToken);
            if (payload) {
              const userData = {
                id: payload.userId || payload.sub,
                email: payload.email,
                fullName: payload.fullName || payload.name,
                roles: payload.roles || [payload.role],
                roleName: payload.roleName || payload.role || payload.roles?.[0],
              };
              setUser(userData);
              setIsAuthenticated(true);
              console.log('Auth init - authenticated with payload (fallback):', userData);
            } else {
              // Both profile API and token verification failed, clear token
              console.error('Auth init - token invalid or expired, clearing session');
              setSession(null);
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        } else {
          console.log('Auth init - no accessToken found');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsInitialized(true);
        console.log('Auth init - completed, isAuthenticated:', isAuthenticated);
      }
    };

    initialize();
  }, []);

  // ----------------------------------------------------------------------
  const login = async (accessToken, userData) => {
    console.log('Login called with accessToken:', !!accessToken, 'userData:', userData);
    
    if (accessToken) {
      setSession(accessToken);
      
      // If userData is provided, use it directly (most reliable)
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        console.log('Login successful with userData:', userData);
        return;
      }
      
      // If no userData, try to get from token payload
      const payload = await getPayload(accessToken);
      if (payload) {
        const finalUserData = {
          id: payload.userId || payload.sub,
          email: payload.email,
          fullName: payload.fullName || payload.name,
          roles: payload.roles || [payload.role],
          roleName: payload.roleName || payload.role || payload.roles?.[0],
        };
        
        setUser(finalUserData);
        setIsAuthenticated(true);
        console.log('Login successful with payload:', finalUserData);
      } else {
        // If payload verification fails, try to get profile from API
        try {
          const response = await authApi.getProfile();
          if (response.data?.profile) {
            setUser(response.data.profile);
            setIsAuthenticated(true);
            console.log('Login successful with profile API:', response.data.profile);
          } else {
            console.warn('Login: token exists but cannot get user info');
            // Still set authenticated if we have token, user info will be fetched later
            setIsAuthenticated(true);
          }
        } catch (profileError) {
          console.warn('Login: failed to get profile, but token exists:', profileError);
          // If we have a token, assume authenticated even if we can't get user info
          setIsAuthenticated(true);
        }
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


