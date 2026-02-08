import axios from 'axios';

const api = axios.create({
 baseURL: '/api',
 headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
 // Avval sessionStorage dan (admin uchun), keyin localStorage dan (kassir/helper uchun)
 const token = sessionStorage.getItem('token') || localStorage.getItem('token');
 if (token) config.headers.Authorization = `Bearer ${token}`;
 return config;
});

api.interceptors.response.use(
 response => response,
 error => {
 if (error.response?.status === 401) {
 sessionStorage.removeItem('token');
 localStorage.removeItem('token');
 window.location.href = '/login';
 }
 return Promise.reject(error);
 }
);

export default api;
