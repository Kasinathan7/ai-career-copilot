// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5002/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  console.log('API REQUEST →', config.method?.toUpperCase(), config.baseURL + config.url);
  return config;
});

export default api;
