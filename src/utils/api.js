import { API_CONFIG, getApiUrl } from "../config/api";
import secureStorage from "./secureStorage";

// API request utility function
export const apiRequest = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const token = secureStorage.getToken();

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  // Add authorization header if token exists
  if (token) {
    defaultHeaders["Authorization"] = `Token ${token}`;
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
