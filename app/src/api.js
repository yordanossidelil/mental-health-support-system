import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('mhUser') || 'null');
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mhUser');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ─── Client ──────────────────────────────────────────────────────────────────
export const clientAPI = {
  getDashboard: () => api.get('/client/dashboard'),
  getTherapists: (params) => api.get('/client/therapists', { params }),

  // Appointments
  getAppointments: () => api.get('/client/appointments'),
  createAppointment: (data) => api.post('/client/appointments', data),
  updateAppointmentStatus: (id, status) => api.put(`/client/appointments/${id}/status`, { status }),
  cancelAppointment: (id) => api.delete(`/client/appointments/${id}`),

  // Payments
  getPayments: () => api.get('/payments'),
  getPaymentById: (id) => api.get(`/payments/${id}`),
  initializePayment: (data) => api.post('/payments/initialize', data),
  verifyPayment: (txRef) => api.get(`/payments/verify/${txRef}`),

  // Assessments
  submitAssessment: (data) => api.post('/client/assessment', data),
  getAssessmentResults: () => api.get('/client/assessment/results'),
  getAssessmentQuestions: (type) => api.get(`/client/assessment/questions/${type}`),
  getRecommendations: () => api.get('/client/assessment/recommendations'),

  // Reviews
  getReviews: () => api.get('/client/reviews'),
  createReview: (data) => api.post('/client/reviews', data),
  updateReview: (id, data) => api.put(`/client/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/client/reviews/${id}`),
};

// ─── Therapist ───────────────────────────────────────────────────────────────
export const therapistAPI = {
  register: (data) => api.post('/therapist/register', data),
  getDashboard: () => api.get('/therapist/dashboard'),
  getProfile: () => api.get('/therapist/profile'),
  updateProfile: (data) => api.put('/therapist/profile', data),
  getVerificationStatus: () => api.get('/therapist/verification-status'),
  reVerify: () => api.post('/therapist/re-verify'),
  reuploadVerification: (data) => api.post('/therapist/reupload-license', data),

  getAppointments: () => api.get('/therapist/appointments'),
  updateAppointmentStatus: (id, status) => api.put(`/therapist/appointments/${id}/status`, { status }),

  getAvailability: () => api.get('/therapist/availability'),
  updateAvailability: (data) => api.put('/therapist/availability', data),

  getClientRequests: () => api.get('/therapist/requests'),
  respondToRequest: (id, action) => api.put(`/therapist/requests/${id}`, { action }),

  getEarnings: () => api.get('/therapist/earnings'),
  getReviews: () => api.get('/therapist/reviews'),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),

  getVerifications: () => api.get('/admin/verifications'),
  flagVerification: (id, reason) => api.put(`/admin/verifications/${id}/flag`, { reason }),
  suspendTherapist: (id) => api.put(`/admin/verifications/${id}/suspend`),
  requestReupload: (id) => api.put(`/admin/verifications/${id}/reupload`),

  getAppointments: (params) => api.get('/admin/appointments', { params }),
  getPayments: (params) => api.get('/admin/payments', { params }),
  getReports: () => api.get('/admin/reports'),
  updateReportStatus: (id, status) => api.put(`/admin/reports/${id}/status`, { status }),
  getReviews: () => api.get('/admin/reviews'),
  getAnalytics: () => api.get('/admin/analytics'),
};

// ─── Public ──────────────────────────────────────────────────────────────────
export const publicAPI = {
  getTherapists: (params) => api.get('/therapists', { params }),
  getTherapistById: (id) => api.get(`/therapists/${id}`),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (ids) => api.patch('/notifications/read', { ids }),
  sendAnnouncement: (data) => api.post('/notifications/send', data),
};

export default api;
