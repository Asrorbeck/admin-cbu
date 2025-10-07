// API Configuration
export const API_CONFIG = {
  BASE_URL: "https://jonibekdaminov.pythonanywhere.com/api/v1",
  ENDPOINTS: {
    LOGIN: "/token/login/",
    DEPARTMENTS: "/departments/",
    MANAGEMENT: "/management/",
  },
};

// Helper function to get API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
