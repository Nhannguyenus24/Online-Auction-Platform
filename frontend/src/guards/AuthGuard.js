import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// hooks
import useAuth from '../hooks/useAuth';
// pages
import Login from '../pages/auth/Login';
// components
import LoadingScreen from '../components/LoadingScreen';
import { getPackageStatus } from '../utils/api';
// ----------------------------------------------------------------------

AuthGuard.propTypes = {
  children: PropTypes.node,
};

export default function AuthGuard({ children }) {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const [isActive, setIsActive] = useState(true);
  const { pathname } = useLocation();
  const [requestedLocation, setRequestedLocation] = useState(null);
  // useEffect(() => {
  //   const getUserPackageStatus = async () => {
  //     const packageStatus = await getPackageStatus();
  //     setIsActive(packageStatus?.data?.isPackageActive  || false);
  //   }
  //   if (isInitialized && isAuthenticated) {
  //     getUserPackageStatus();
  //   }
  // }, [isAuthenticated, isInitialized, pathname]);
  if (!isInitialized) {
    return <LoadingScreen />;
  }
  if (!isAuthenticated) {
    if (pathname !== requestedLocation) {
      setRequestedLocation(pathname);
    }
    return <Login />;
  }
  if (!user || !user?.roleName) {
    return <Navigate to="/404" />;
  }
  // if (!(user.roleName === 'admin' || user.roleName === 'Admin') && isActive === false && pathname !== '/recruitment-packages' && pathname !== '/check-out') {
  //   window.location.href = '/recruitment-packages';
  //   return;
  // }
  if (requestedLocation && pathname !== requestedLocation) {
    setRequestedLocation(null);
    return <Navigate to={requestedLocation} />;
  }

  return <>{children}</>;
}
