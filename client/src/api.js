import axios from 'axios';

let tokenProvider = async () => localStorage.getItem('edemy_token');
export const setTokenProvider = (provider) => { tokenProvider = provider || (async () => localStorage.getItem('edemy_token')); };

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 20000
});

api.interceptors.request.use(async (config) => {
  const token = await tokenProvider();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong.';
    error.userMessage = message;
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) => error?.userMessage || error?.response?.data?.message || error?.message || 'Something went wrong.';
