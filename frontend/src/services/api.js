import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartgov_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('smartgov_token');
      localStorage.removeItem('smartgov_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// === AUTH ===
export const authAPI = {
  employeeLogin: (data) => api.post('/auth/employee/login', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
  getMe: () => api.get('/auth/me'),
};

// === OFFICES ===
export const officesAPI = {
  getAll: (params) => api.get('/offices', { params }),
  getById: (id) => api.get(`/offices/${id}`),
  getServices: (id) => api.get(`/offices/${id}/services`),
  create: (data) => api.post('/offices', data),
  update: (id, data) => api.put(`/offices/${id}`, data),
  addService: (id, data) => api.post(`/offices/${id}/services`, data),
};

// === SERVICES ===
export const servicesAPI = {
  getById: (id) => api.get(`/services/${id}`),
};

// === QUEUE ===
export const queueAPI = {
  getStatus: (officeId) => api.get(`/queue/${officeId}/status`),
  predict: (officeId, token) => api.get(`/queue/${officeId}/predict`, { params: { token } }),
  join: (officeId, data) => api.post(`/queue/${officeId}/join`, data),
  updateToken: (officeId, data) => api.put(`/queue/${officeId}/update-token`, data),
  pause: (officeId, data) => api.put(`/queue/${officeId}/pause`, data),
  resume: (officeId) => api.put(`/queue/${officeId}/resume`),
  getHistory: (officeId, params) => api.get(`/queue/${officeId}/history`, { params }),
};

// === ANALYTICS ===
export const analyticsAPI = {
  getOfficeAnalytics: (officeId) => api.get(`/analytics/office/${officeId}`),
  getAllOffices: () => api.get('/analytics/admin/all'),
  getLogs: (params) => api.get('/analytics/admin/logs', { params }),
};

// === ADMIN ===
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getEmployees: (params) => api.get('/admin/employees', { params }),
  createEmployee: (data) => api.post('/admin/employees', data),
  resetPassword: (id, data) => api.put(`/admin/employees/${id}/reset-password`, data),
  deactivateEmployee: (id) => api.delete(`/admin/employees/${id}`),
  createAnnouncement: (data) => api.post('/admin/announcements', data),
  getLiveQueues: () => api.get('/admin/live-queues'),
};

// === EMPLOYEE ===
export const employeeAPI = {
  getMyQueue: () => api.get('/employee/my-queue'),
  getAnnouncements: () => api.get('/employee/announcements'),
  createAnnouncement: (data) => api.post('/employee/announcements', data),
  deleteAnnouncement: (id) => api.delete(`/employee/announcements/${id}`),
  getActivity: () => api.get('/employee/activity'),
};

// === CHATBOT ===
export const chatbotAPI = {
  send: (data) => api.post('/chatbot', data),
};

export default api;
