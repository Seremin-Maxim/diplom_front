// Конфигурация API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const API = {
  AUTH: {
    SIGNIN: `${API_BASE_URL}/api/auth/signin`,
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  },
  USERS: {
    PROFILE: `${API_BASE_URL}/api/users/profile`,
  },
  COURSES: {
    BASE: `${API_BASE_URL}/api/courses`,
    BY_ID: (id) => `${API_BASE_URL}/api/courses/${id}`,
  },
  LESSONS: {
    BASE: `${API_BASE_URL}/api/lessons`,
    BY_ID: (id) => `${API_BASE_URL}/api/lessons/${id}`,
  },
};

export default API;
