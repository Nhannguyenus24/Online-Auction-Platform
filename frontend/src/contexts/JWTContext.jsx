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
          // Kiểm tra xem có phải mock token không (tạm thời cho mock API)
          const isMockToken = accessToken.startsWith('mock_token_');
          
          if (isMockToken) {
            // Với mock token, lấy user data từ localStorage (nếu có)
            // Hoặc để trống và chờ login lại
            const savedUserData = window.localStorage.getItem('userData');
            if (savedUserData) {
              try {
                const userData = JSON.parse(savedUserData);
                setSession(accessToken);
                setUser(userData);
                setIsAuthenticated(true);
              } catch (e) {
                // Nếu parse fail, clear và logout
                setSession(null);
                setUser(null);
                setIsAuthenticated(false);
              }
            } else {
              // Không có user data, clear token
              setSession(null);
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            // JWT thật - verify và gọi API
            try {
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
            } catch (err) {
              // Token không hợp lệ
              setSession(null);
              setUser(null);
              setIsAuthenticated(false);
            }
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
    if (accessToken && userData) {
      try {
        // Thử verify token nếu có thể (JWT thật)
        const payload = await getPayload(accessToken);
        if (payload) {
          setSession(accessToken);
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          console.warn('Access token invalid at login');
        }
      } catch (error) {
        // Nếu token không phải JWT hợp lệ (ví dụ: mock token), vẫn cho phép login với userData
        // Đây là trường hợp tạm thời cho mock API, sẽ bỏ khi có backend thật
        setSession(accessToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Lưu userData vào localStorage để có thể restore khi refresh (chỉ cho mock token)
        if (accessToken.startsWith('mock_token_')) {
          window.localStorage.setItem('userData', JSON.stringify(userData));
        }
      }
    }
  };

  const logout = async () => {
    setSession(null);
    setUser(null);
    setIsAuthenticated(false);
    // Xóa userData khỏi localStorage
    window.localStorage.removeItem('userData');
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

export { AuthContext };
