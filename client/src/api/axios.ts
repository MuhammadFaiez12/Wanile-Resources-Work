import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const pin = sessionStorage.getItem('pm_pin');
  if (pin) config.headers['x-pm-pin'] = pin;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.message || err?.response?.data?.error || err.message;
    return Promise.reject(new Error(msg));
  },
);

export default api;
