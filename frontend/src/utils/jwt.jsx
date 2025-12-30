import axiosInstance from './axios';
import { jwtVerify, importSPKI } from 'jose';

// ----------------------------------------------------------------------
const PUBLIC_KEY_PEM = import.meta.env.VITE_PUBLIC_KEY;


const isValidToken = async (accessToken) => {
  if (!accessToken) {
    return false;
  }

  try {
    const publicKey = await importSPKI(PUBLIC_KEY_PEM, 'RS256');

    const { payload } = await jwtVerify(accessToken, publicKey);

    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;

  } catch (error) {
    console.error('Token expired or invalid:', error);
    return false;
  }
};

const getPayload = async (accessToken) => {
  try {
    if (!PUBLIC_KEY_PEM) {
      console.warn('VITE_PUBLIC_KEY is not set, cannot verify token');
      return null;
    }
    const publicKey = await importSPKI(PUBLIC_KEY_PEM, 'RS256');
    const { payload } = await jwtVerify(accessToken, publicKey);
    return payload;
  } catch (error) {
    console.error('Failed to get payload from token:', error);
    return null;
  }
};

const setSession = (accessToken) => {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    localStorage.removeItem('accessToken');
    delete axiosInstance.defaults.headers.common.Authorization;
  }
};

export { isValidToken, setSession, getPayload };
