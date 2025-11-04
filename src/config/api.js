// API Configuration
export const API_CONFIG = {
  BASE_URL: "https://bd242f6369a3.ngrok-free.app/api/v1",
  ENDPOINTS: {
    LOGIN: "/token/",
    TOKEN_REFRESH: "/token/refresh/",
    DEPARTMENTS: "/departments/",
    MANAGEMENT: "/management/",
    VACANCIES: "/vacancies/",
    APPEALS: "/Appeals/",
  },
};

// Helper function to get API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
