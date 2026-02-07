import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.response?.data?.error || error.message;

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;

// API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

export const chatAPI = {
  sendMessage: (data) => {
    const { sessionId, ...messageData } = data;
    return api.post(`/chat/sessions/${sessionId}/messages`, messageData);
  },
  getSessions: (params) => api.get('/chat/sessions', { params }),
  createSession: (data) => api.post('/chat/sessions', data),
  getSession: (id) => api.get(`/chat/sessions/${id}`),
  deleteSession: (id) => api.delete(`/chat/sessions/${id}`),
};

export const resumeAPI = {
  getResumes: (params) => api.get('/resumes', { params }),
  getResume: (id) => api.get(`/resumes/${id}`),
  createResume: (data) => api.post('/resumes', data),
  updateResume: (id, data) => api.put(`/resumes/${id}`, data),
  deleteResume: (id) => api.delete(`/resumes/${id}`),
  uploadResume: (formData) => api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  analyzeResume: (id, data) => api.post(`/resumes/${id}/analyze`, data),
  getATSScore: (id) => api.get(`/resumes/${id}/ats-score`),
  generatePDF: (id) => api.get(`/resumes/${id}/pdf`, { responseType: 'blob' }),
  enhanceResume: (id, data) => api.post(`/resumes/${id}/enhance`, data),
};

export const jobAPI = {
  searchJobs: (criteria) => api.post('/jobs/search', criteria),
  getSearchHistory: (params) => api.get('/jobs/searches', { params }),
  getSavedJobs: (params) => api.get('/jobs/saved', { params }),
  updateJobStatus: (jobId, data) => api.put(`/jobs/${jobId}/status`, data),
  getRecommendations: () => api.get('/jobs/recommendations'),
  saveJob: (jobData) => api.post('/jobs/save', jobData),
  removeJob: (jobId) => api.delete(`/jobs/saved/${jobId}`),
  applyToJob: (jobId, applicationData) => api.post(`/jobs/${jobId}/apply`, applicationData),
  getApplications: (params) => api.get('/jobs/applications', { params }),
  searchExternal: (criteria) => api.get('/external-jobs/search', { params: criteria }),
  getJobSources: () => api.get('/external-jobs/sources'),
};

// New API endpoints for specialized bots
export const atsAPI = {
  analyzeResume: (formData) => api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getScore: (resumeId) => api.get(`/resumes/${resumeId}/ats-score`),
  getRecommendations: (resumeId) => api.get(`/resumes/${resumeId}/recommendations`),
};

export const interviewAPI = {
  startSession: (sessionData) => api.post('/chat/sessions', {
    type: 'mock-interview',
    ...sessionData
  }),
  generateQuestion: (sessionId, type, level) => api.post('/chat/message', {
    sessionId,
    message: `Generate a ${type} interview question for ${level} level`,
    botType: 'mock-interview'
  }),
  submitAnswer: (sessionId, questionData) => api.post('/chat/message', {
    sessionId,
    message: `Please analyze my interview answer and provide feedback.`,
    botType: 'mock-interview',
    metadata: questionData
  }),
  getHistory: () => api.get('/chat/sessions', { params: { type: 'mock-interview' } }),
  getFeedback: (sessionId) => api.get(`/chat/sessions/${sessionId}/feedback`),
};

export const careerAPI = {
  submitAssessment: (assessmentData) => api.post('/chat/sessions', {
    type: 'job-suggester',
    metadata: { assessmentData }
  }),
  getCareerSuggestions: (sessionId) => api.post('/chat/message', {
    sessionId,
    message: 'Provide career suggestions based on my assessment',
    botType: 'job-suggester'
  }),
  getSkillGapAnalysis: (currentSkills, targetRole) => api.post('/chat/message', {
    message: `Analyze skill gaps for transition to ${targetRole}`,
    botType: 'job-suggester',
    metadata: { currentSkills, targetRole }
  }),
  getCareerPath: (careerGoal) => api.post('/chat/message', {
    message: `Provide detailed career path for ${careerGoal}`,
    botType: 'job-suggester'
  }),
};
