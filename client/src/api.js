import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// PM PIN is kept in sessionStorage and attached to protected requests.
api.interceptors.request.use((config) => {
  const pin = sessionStorage.getItem('pm_pin');
  if (pin) config.headers['x-pm-pin'] = pin;
  return config;
});

export default api;
