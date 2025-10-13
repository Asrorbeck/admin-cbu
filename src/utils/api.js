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
            throw new Error(
              errorData.detail ||
                errorData.message ||
                `HTTP error! status: ${retryResponse.status}`
            );
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
                throw new Error(
                  errorData.detail ||
                    errorData.message ||
                    `HTTP error! status: ${retryResponse.status}`
                );
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
      throw new Error(
        errorData.detail ||
          errorData.message ||
          `HTTP error! status: ${response.status}`
      );
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
export const getVacanciesApi = async (managementId = null) => {
  const endpoint = managementId
    ? `${API_CONFIG.ENDPOINTS.VACANCIES}?management_id=${managementId}`
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
export const getApplicationsApi = async () => {
  return apiRequest("/apply-jobs/", {
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

// Logout API call (if needed)
export const logoutApi = async () => {
  // Clear secure storage
  secureStorage.clearAll();
};
