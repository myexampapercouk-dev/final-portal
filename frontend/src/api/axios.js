import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Strip the trailing /api so uploaded-file links (e.g. /uploads/materials/x.pdf)
// resolve against the server root, not the API prefix.
export const FILE_BASE_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
