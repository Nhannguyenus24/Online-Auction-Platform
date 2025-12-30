import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from '../components/LoadingScreen';

export default function GuestGuard({ children }) {
  const { isAuthenticated, isInitialized, user } = useAuth();

  // Wait for auth to initialize
  if (!isInitialized) return <LoadingScreen />;

  // If user is authenticated, redirect based on role
  if (isAuthenticated && user) {
    const roleName = user.roleName?.toLowerCase() || user.roles?.[0]?.toLowerCase() || '';
    
    if (roleName === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (roleName === 'seller') {
      return <Navigate to="/seller/home" replace />;
    }
    if (roleName === 'bidder') {
      return <Navigate to="/bidder/home" replace />;
    }
    
    // Default redirect to home if role is unknown
    return <Navigate to="/" replace />;
  }

  // User is not authenticated, allow access to auth pages
  return <>{children}</>;
}

