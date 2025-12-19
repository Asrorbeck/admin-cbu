// API Configuration
// Get API URLs from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_SPELLING_REPORTS_URL = import.meta.env.VITE_API_SPELLING_REPORTS_URL;

// Validate that required environment variables are set
if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_BASE_URL environment variable is not set. Please check your .env file."
  );
}

if (!API_SPELLING_REPORTS_URL) {
  throw new Error(
    "VITE_API_SPELLING_REPORTS_URL environment variable is not set. Please check your .env file."
  );
}

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
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
    SPELLING_REPORTS: API_SPELLING_REPORTS_URL,
    SURVEYS: "/survey-admin/surveys/",
    SURVEY_QUESTIONS: "/survey-admin/questions/",
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
