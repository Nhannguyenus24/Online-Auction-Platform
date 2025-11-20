import jwtDecode from 'jwt-decode';
import axiosInstance from './axios';
//

// ----------------------------------------------------------------------

const isValidToken = (accessToken) => {
  if (!accessToken) {
    return false;
  }

  // ----------------------------------------------------------------------

  const decoded = jwtDecode(accessToken);
  const currentTime = Date.now() / 1000;

  return decoded.exp > currentTime;
};

// ----------------------------------------------------------------------

const setSession = (accessToken) => {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  } else {
    localStorage.removeItem('accessToken');
    delete axiosInstance.defaults.headers.common.Authorization;
  }
};

export { isValidToken, setSession };
