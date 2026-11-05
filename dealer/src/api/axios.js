import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dealerToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dealerToken');
      localStorage.removeItem('dealerUser');
      if (!window.location.pathname.startsWith('/dealer/login')) {
        window.location.href = '/dealer/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
