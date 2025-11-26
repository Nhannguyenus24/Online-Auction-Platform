import PropTypes from 'prop-types';
import { useState, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// hooks
import {GoogleAuthContext} from '../contexts/GoogleAuthContext';
// pages
import Login from '../pages/employee/EmployeeLogin';

// ----------------------------------------------------------------------

EmployeeGuard.propTypes = {
  children: PropTypes.node,
};

export default function EmployeeGuard({ children }) {
  const { isAuthenticatedEmployee, user } = useContext(GoogleAuthContext);
  const { pathname } = useLocation();
  const [requestedLocation, setRequestedLocation] = useState(null);
  
  if (!isAuthenticatedEmployee) {
    if (pathname !== requestedLocation) {
      setRequestedLocation(pathname);
    }
    return <Login />;
  }
  if (!user || user?.roleName) {
    return <Navigate to="/404" />;
  }
  if (requestedLocation && pathname !== requestedLocation) {
    setRequestedLocation(null);
    return <Navigate to={requestedLocation} />;
  }

  return <>{children}</>;
}
