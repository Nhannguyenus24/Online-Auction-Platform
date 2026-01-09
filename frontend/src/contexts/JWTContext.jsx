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
      let authResult = false;
      let userData = null;
      
      try {
        const accessToken = window.localStorage.getItem('accessToken');
        
        if (accessToken) {
          // Set session first to ensure axios has the token
          setSession(accessToken);
          
          // Try to get profile from API first (most reliable)
          // Note: axios interceptor will automatically handle 401 by refreshing token
          try {
            const response = await authApi.getProfile();
            
            // Check different possible response formats
            const profile = response.data?.profile || response.data?.data?.profile || response.data;
            
            if (profile && (profile.id || profile.userId)) {
              userData = {
                id: profile.id || profile.userId,
                email: profile.email,
                fullName: profile.fullName || profile.name,
                roles: profile.roles || [profile.role],
                roleName: profile.roleName || profile.role || profile.roles?.[0],
                phoneNumber: profile.phoneNumber,
                address: profile.address,
                isVerified: profile.isVerified,
              };
              authResult = true;
            } else {
              // If response doesn't have profile, try to use token payload as fallback
              const payload = await getPayload(accessToken);
              if (payload) {
                userData = {
                  id: payload.userId || payload.sub,
                  email: payload.email,
                  fullName: payload.fullName || payload.name,
                  roles: payload.roles || [payload.role],
                  roleName: payload.roleName || payload.role || payload.roles?.[0],
                };
                authResult = true;
              }
            }
          } catch (profileError) {
            // If profile API still fails after axios interceptor attempted refresh
            const status = profileError.response?.status;
            
            if (status === 401) {
              // Token refresh failed - clear session
              console.error('Auth init - token refresh failed, clearing session');
              setSession(null);
              authResult = false;
              userData = null;
            } else if (status === 403) {
              // Forbidden - user exists but no permission
              setSession(null);
              authResult = false;
              userData = null;
            } else {
              // Other errors - try token payload as fallback
              const payload = await getPayload(accessToken);
              if (payload) {
                userData = {
                  id: payload.userId || payload.sub,
                  email: payload.email,
                  fullName: payload.fullName || payload.name,
                  roles: payload.roles || [payload.role],
                  roleName: payload.roleName || payload.role || payload.roles?.[0],
                };
                authResult = true;
              } else {
                console.error('Auth init - profile error and token invalid:', profileError.message);
                setSession(null);
                authResult = false;
                userData = null;
              }
            }
          }
        } else {
          authResult = false;
          userData = null;
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setSession(null);
        authResult = false;
        userData = null;
      } finally {
        // Set state with the determined values
        setUser(userData);
        setIsAuthenticated(authResult);
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  // ----------------------------------------------------------------------
  const login = async (accessToken, userData) => {
    
    if (accessToken) {
      setSession(accessToken);
      
      // If userData is provided, use it directly (most reliable)
      if (userData) {
        const finalUserData = {
          id: userData.id || userData.userId,
          email: userData.email,
          fullName: userData.fullName || userData.name,
          roles: userData.roles || [userData.role],
          roleName: userData.roleName || userData.role || userData.roles?.[0],
          phoneNumber: userData.phoneNumber,
          address: userData.address,
          isVerified: userData.isVerified,
        };
        setUser(finalUserData);
        setIsAuthenticated(true);
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
      } else {
        // If payload verification fails, try to get profile from API
        try {
          const response = await authApi.getProfile();
          
          // Check different possible response formats
          const profile = response.data?.profile || response.data?.data?.profile || response.data;
          
          if (profile && (profile.id || profile.userId)) {
            const finalUserData = {
              id: profile.id || profile.userId,
              email: profile.email,
              fullName: profile.fullName || profile.name,
              roles: profile.roles || [profile.role],
              roleName: profile.roleName || profile.role || profile.roles?.[0],
              phoneNumber: profile.phoneNumber,
              address: profile.address,
              isVerified: profile.isVerified,
            };
            setUser(finalUserData);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(true);
          }
        } catch (profileError) {
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


