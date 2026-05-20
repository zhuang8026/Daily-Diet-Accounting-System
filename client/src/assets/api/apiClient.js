import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send HttpOnly cookie on every request
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ddas_session');
      window.location.hash = '#/login';
    }
    return Promise.reject(err);
  },
);

export default apiClient;
