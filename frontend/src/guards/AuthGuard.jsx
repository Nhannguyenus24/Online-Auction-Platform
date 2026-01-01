import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from '../components/LoadingScreen';

// Map path prefix → required role
const ROLE_PREFIX_MAP = {
  '/admin': 'admin',
  '/seller': 'seller',
  '/bidder': 'bidder',
};

export default function AuthGuard({ children }) {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const { pathname } = useLocation();
  // un authenticate → show loading
  if (!isInitialized) return <LoadingScreen />;

  // un authenticate → redirect 404
  if (!isAuthenticated) return <Navigate to="/404" replace />;

  // user not exist → 404
  if (!user || !user.role) return <Navigate to="/404" replace />;

  // check role
  const matchedPrefix = Object.keys(ROLE_PREFIX_MAP).find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (matchedPrefix) {
    const requiredRole = ROLE_PREFIX_MAP[matchedPrefix];
    if (user.role.toLowerCase() !== requiredRole.toLowerCase()) {
      return <Navigate to="/404" replace />;
    }
  }
  return <>{children}</>;
}
