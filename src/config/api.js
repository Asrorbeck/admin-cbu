// API Configuration
export const API_CONFIG = {
  BASE_URL: "https://4a8a7d4f11a3.ngrok-free.app/api/v1",
  ENDPOINTS: {
    LOGIN: "/token/",
    TOKEN_REFRESH: "/token/refresh/",
    DEPARTMENTS: "/departments/",
    MANAGEMENT: "/management/",
    VACANCIES: "/vacancies/",
    APPEALS: "/Appeals/",
    TESTS: "/tests/",
  },
};

// Helper function to get API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
