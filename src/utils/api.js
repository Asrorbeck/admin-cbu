import { API_CONFIG, getApiUrl } from "../config/api";
import secureStorage from "./secureStorage";

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

// Function to notify all subscribers when token is refreshed
const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Function to add subscriber to refresh queue
const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// Refresh access token using refresh token
export const refreshAccessToken = async () => {
  const refreshToken = secureStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await fetch(
      getApiUrl(API_CONFIG.ENDPOINTS.TOKEN_REFRESH),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();

    // Update both tokens in storage
    if (data.access && data.refresh) {
      secureStorage.setTokens(data.access, data.refresh);
      return data.access;
    } else if (data.access) {
      secureStorage.updateAccessToken(data.access);
      return data.access;
    }

    throw new Error("Invalid token refresh response");
  } catch (error) {
    // If refresh fails, clear all auth data and redirect to login
    secureStorage.clearAll();
    window.location.href = "/login";
    throw error;
  }
};

// API request utility function with automatic token refresh
export const apiRequest = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const token = secureStorage.getAccessToken();

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  // Add authorization header if token exists (JWT Bearer format)
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // If unauthorized (401), try to refresh the token
    if (response.status === 401 && token) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();
          isRefreshing = false;
          onRefreshed(newToken);

          // Retry the original request with new token
          config.headers["Authorization"] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, config);

          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            const error = new Error(
              errorData.detail ||
                errorData.message ||
                `HTTP error! status: ${retryResponse.status}`
            );
            error.responseData = errorData;
            error.status = retryResponse.status;
            throw error;
          }

          return await retryResponse.json();
        } catch (refreshError) {
          isRefreshing = false;
          throw refreshError;
        }
      } else {
        // If already refreshing, wait for the refresh to complete
        return new Promise((resolve, reject) => {
          addRefreshSubscriber(async (newToken) => {
            try {
              config.headers["Authorization"] = `Bearer ${newToken}`;
              const retryResponse = await fetch(url, config);

              if (!retryResponse.ok) {
                const errorData = await retryResponse.json().catch(() => ({}));
                const error = new Error(
                  errorData.detail ||
                    errorData.message ||
                    `HTTP error! status: ${retryResponse.status}`
                );
                error.responseData = errorData;
                error.status = retryResponse.status;
                throw error;
              }

              resolve(await retryResponse.json());
            } catch (error) {
              reject(error);
            }
          });
        });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.detail ||
          errorData.message ||
          `HTTP error! status: ${response.status}`
      );
      // Preserve the full error data for field-specific error handling
      error.responseData = errorData;
      error.status = response.status;
      throw error;
    }

    // Handle empty responses (e.g., 204 No Content or empty body)
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    if (
      response.status === 204 ||
      contentLength === "0" ||
      !contentType ||
      !contentType.includes("application/json")
    ) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// Login API call
export const loginApi = async (username, password) => {
  return apiRequest(API_CONFIG.ENDPOINTS.LOGIN, {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
    }),
  });
};

// Departments API calls
export const getDepartmentsApi = async () => {
  return apiRequest(API_CONFIG.ENDPOINTS.DEPARTMENTS, {
    method: "GET",
  });
};

export const getDepartmentApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.DEPARTMENTS}${id}/`, {
    method: "GET",
  });
};

export const createDepartmentApi = async (data) => {
  return apiRequest(API_CONFIG.ENDPOINTS.DEPARTMENTS, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateDepartmentApi = async (id, data) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.DEPARTMENTS}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteDepartmentApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.DEPARTMENTS}${id}/`, {
    method: "DELETE",
  });
};

// Management API calls
export const getManagementApi = async (departmentId = null) => {
  const endpoint = departmentId
    ? `${API_CONFIG.ENDPOINTS.MANAGEMENT}?department_id=${departmentId}`
    : API_CONFIG.ENDPOINTS.MANAGEMENT;

  return apiRequest(endpoint, {
    method: "GET",
  });
};

export const getManagementByIdApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.MANAGEMENT}${id}/`, {
    method: "GET",
  });
};

export const createManagementApi = async (data) => {
  return apiRequest(API_CONFIG.ENDPOINTS.MANAGEMENT, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateManagementApi = async (id, data) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.MANAGEMENT}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteManagementApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.MANAGEMENT}${id}/`, {
    method: "DELETE",
  });
};

// Vacancy API calls
export const getVacanciesApi = async (managementId = null, params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (managementId) {
    queryParams.append("management_id", managementId);
  }
  
  // Add region and branch_type params if provided
  if (params.region) {
    queryParams.append("region", params.region);
  }
  if (params.branch_type) {
    queryParams.append("branch_type", params.branch_type);
  }
  
  const queryString = queryParams.toString();
  const endpoint = queryString 
    ? `${API_CONFIG.ENDPOINTS.VACANCIES}?${queryString}`
    : API_CONFIG.ENDPOINTS.VACANCIES;

  return apiRequest(endpoint, {
    method: "GET",
  });
};

export const getVacancyByIdApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.VACANCIES}${id}/`, {
    method: "GET",
  });
};

export const createVacancyApi = async (data) => {
  return apiRequest(API_CONFIG.ENDPOINTS.VACANCIES, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateVacancyApi = async (id, data) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.VACANCIES}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteVacancyApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.VACANCIES}${id}/`, {
    method: "DELETE",
  });
};

// Applications API calls
export const getApplicationsApi = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.application_deadline) {
    queryParams.append("application_deadline", params.application_deadline);
  }
  
  const queryString = queryParams.toString();
  const endpoint = queryString 
    ? `/apply-jobs/?${queryString}`
    : "/apply-jobs/";
  
  return apiRequest(endpoint, {
    method: "GET",
  });
};

export const getDeadlineArchivesApi = async () => {
  return apiRequest("/deadline-archives/", {
    method: "GET",
  });
};

export const getApplicationByIdApi = async (id) => {
  return apiRequest(`/apply-jobs/${id}/`, {
    method: "GET",
  });
};

export const updateApplicationApi = async (id, data) => {
  return apiRequest(`/apply-jobs/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteApplicationApi = async (id) => {
  return apiRequest(`/apply-jobs/${id}/`, {
    method: "DELETE",
  });
};

// Appeals API calls
export const getAppealsApi = async () => {
  return apiRequest(API_CONFIG.ENDPOINTS.APPEALS, {
    method: "GET",
  });
};

export const updateAppealApi = async (id, data) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.APPEALS}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// Spelling reports API calls
export const getSpellingReportsApi = async () => {
  return apiRequest(API_CONFIG.ENDPOINTS.SPELLING_REPORTS, {
    method: "GET",
  });
};

export const updateSpellingReportApi = async (id, data) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.SPELLING_REPORTS}${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Vacancy Selection Hierarchy API
export const getVacancySelectionHierarchyApi = async () => {
  return apiRequest("/vacancy-selection/hierarchy/", {
    method: "GET",
  });
};

// Tests API calls
export const getTestsApi = async () => {
  return apiRequest(API_CONFIG.ENDPOINTS.TESTS, {
    method: "GET",
  });
};

export const getTestByIdApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.TESTS}${id}/`, {
    method: "GET",
  });
};

export const createTestApi = async (data) => {
  return apiRequest(API_CONFIG.ENDPOINTS.TESTS, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateTestApi = async (id, data) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.TESTS}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteTestApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.TESTS}${id}/`, {
    method: "DELETE",
  });
};

// Test Attempts API calls
export const getAttemptsApi = async (params = {}) => {
  // Build query string from params
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append("page", params.page);
  if (params.page_size) queryParams.append("page_size", params.page_size);
  if (params.end_time) queryParams.append("end_time", params.end_time);
  if (params.status) queryParams.append("status", params.status);
  if (params.is_passed !== undefined && params.is_passed !== null) {
    queryParams.append("is_passed", params.is_passed);
  }
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/attempts/?${queryString}` : "/attempts/";
  
  return apiRequest(endpoint, {
    method: "GET",
  });
};

// Restrictions API calls
export const getRestrictionsApi = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append("page", params.page);
  if (params.page_size) queryParams.append("page_size", params.page_size);
  // if (params.is_active !== undefined && params.is_active !== null) {
  //   queryParams.append("is_active", params.is_active);
  // }
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/restrictions/?${queryString}` : "/restrictions/";
  
  return apiRequest(endpoint, {
    method: "GET",
  });
};

export const deleteRestrictionApi = async (id) => {
  return apiRequest(`/restrictions/${id}/`, {
    method: "DELETE",
  });
};

export const updateRestrictionApi = async (id, data) => {
  return apiRequest(`/restrictions/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const sendMeetLinkInviteApi = async (data) => {
  return apiRequest("/attempts/send-invite/", {
    method: "POST",
    body: JSON.stringify({
      attempt_ids: data.attempt_ids,
      meet_link: data.meet_link,
      meet_date: data.meet_date,
      meet_time: data.meet_time,
    }),
  });
};

export const updateAttemptApi = async (id, data) => {
  return apiRequest(`/attempts/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

// FAQ Categories API calls
export const getFaqCategoriesApi = async (section = null) => {
  const endpoint = section
    ? `${API_CONFIG.ENDPOINTS.FAQ_CATEGORIES}?section=${section}`
    : API_CONFIG.ENDPOINTS.FAQ_CATEGORIES;
  return apiRequest(endpoint, {
    method: "GET",
  });
};

export const getFaqCategoryByIdApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.FAQ_CATEGORIES}${id}/`, {
    method: "GET",
  });
};

export const createFaqCategoryApi = async (data, section = null) => {
  const endpoint = section
    ? `${API_CONFIG.ENDPOINTS.FAQ_CATEGORIES}?section=${section}`
    : API_CONFIG.ENDPOINTS.FAQ_CATEGORIES;
  return apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateFaqCategoryApi = async (id, data) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.FAQ_CATEGORIES}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteFaqCategoryApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.FAQ_CATEGORIES}${id}/`, {
    method: "DELETE",
  });
};

// Organizations API calls
export const getOrganizationsApi = async () => {
  return apiRequest(API_CONFIG.ENDPOINTS.ORGANIZATIONS, {
    method: "GET",
  });
};

export const getOrganizationByIdApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.ORGANIZATIONS}${id}/`, {
    method: "GET",
  });
};

export const createOrganizationApi = async (data) => {
  return apiRequest(API_CONFIG.ENDPOINTS.ORGANIZATIONS, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateOrganizationApi = async (id, data) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.ORGANIZATIONS}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteOrganizationApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.ORGANIZATIONS}${id}/`, {
    method: "DELETE",
  });
};

// Corruption Reports API calls
export const getCorruptionReportsApi = async (createdAtFrom = null) => {
  let endpoint = "/report/";
  if (createdAtFrom) {
    endpoint = `/report/?created_at=${createdAtFrom}`;
  }
  return apiRequest(endpoint, {
    method: "GET",
  });
};

export const getCorruptionReportByIdApi = async (id) => {
  return apiRequest(`/report/${id}/`, {
    method: "GET",
  });
};

export const updateCorruptionReportApi = async (id, data) => {
  return apiRequest(`/report/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const sendReportResponseApi = async (reportId, responseText, status) => {
  return apiRequest(`/report/${reportId}/send-response/`, {
    method: "POST",
    body: JSON.stringify({
      report: reportId,
      response_text: responseText,
      status: status,
    }),
  });
};

export const getReportResponsesApi = async (reportId) => {
  return apiRequest(`/report/${reportId}/responses/`, {
    method: "GET",
  });
};

// Surveys API calls
export const getSurveysApi = async () => {
  return apiRequest(API_CONFIG.ENDPOINTS.SURVEYS, {
    method: "GET",
  });
};

export const getSurveyByIdApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.SURVEYS}${id}/`, {
    method: "GET",
  });
};

export const createSurveyApi = async (data) => {
  return apiRequest(API_CONFIG.ENDPOINTS.SURVEYS, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateSurveyApi = async (id, data) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.SURVEYS}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteSurveyApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.SURVEYS}${id}/`, {
    method: "DELETE",
  });
};

// Survey Questions API calls
export const getSurveyQuestionsApi = async (surveyId = null) => {
  const endpoint = surveyId
    ? `${API_CONFIG.ENDPOINTS.SURVEY_QUESTIONS}?survey=${surveyId}`
    : API_CONFIG.ENDPOINTS.SURVEY_QUESTIONS;
  return apiRequest(endpoint, {
    method: "GET",
  });
};

export const getSurveyQuestionByIdApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.SURVEY_QUESTIONS}${id}/`, {
    method: "GET",
  });
};

export const createSurveyQuestionApi = async (data) => {
  return apiRequest(API_CONFIG.ENDPOINTS.SURVEY_QUESTIONS, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateSurveyQuestionApi = async (id, data) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.SURVEY_QUESTIONS}${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteSurveyQuestionApi = async (id) => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.SURVEY_QUESTIONS}${id}/`, {
    method: "DELETE",
  });
};

// Logout API call (if needed)
export const logoutApi = async () => {
  // Clear secure storage
  secureStorage.clearAll();
};
