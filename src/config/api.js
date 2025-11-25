// API Configuration
export const API_CONFIG = {
  BASE_URL: "https://b21b5a398785.ngrok-free.app/api/v1",
  ENDPOINTS: {
    LOGIN: "/token/",
    TOKEN_REFRESH: "/token/refresh/",
    DEPARTMENTS: "/departments/",
    MANAGEMENT: "/management/",
    VACANCIES: "/vacancies/",
    APPEALS: "/Appeals/",
    TESTS: "/tests/",
    FAQ_CATEGORIES: "/faq-categories/",
    ORGANIZATIONS: "/organization/",
    SPELLING_REPORTS: "https://b21b5a398785.ngrok-free.app/api/spelling/reports/",
  },
};

// Helper function to get API URL
export const getApiUrl = (endpoint) => {
  if (!endpoint) {
    return API_CONFIG.BASE_URL;
  }

  if (typeof endpoint === "string" && /^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
