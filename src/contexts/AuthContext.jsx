import { createContext, useContext, useState, useEffect } from "react";
import { loginApi, logoutApi, getUserInfoApi } from "../utils/api";
import secureStorage from "../utils/secureStorage";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from secure storage
    const savedUser = secureStorage.getUser();
    const savedAccessToken = secureStorage.getAccessToken();

    if (savedUser && savedAccessToken) {
      setUser(savedUser);
      // Fetch fresh user info from API
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const userInfo = await getUserInfoApi();
      const userData = {
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        is_staff: userInfo.is_staff,
        is_superuser: userInfo.is_superuser,
        role: userInfo.role,
        role_display: userInfo.role_display,
        assigned_region: userInfo.assigned_region,
        assigned_region_display: userInfo.assigned_region_display,
        permissions: userInfo.permissions || {},
      };
      secureStorage.setUser(userData);
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user info:", error);
      // If error, use saved user data
      const savedUser = secureStorage.getUser();
      if (savedUser) {
        setUser(savedUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await loginApi(username, password);

      if (response.access && response.refresh) {
        // Store JWT tokens (access and refresh) securely
        secureStorage.setTokens(response.access, response.refresh);

        // Fetch user info from API
        try {
          const userInfo = await getUserInfoApi();
          const userData = {
            id: userInfo.id,
            username: userInfo.username,
            email: userInfo.email,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            is_staff: userInfo.is_staff,
            is_superuser: userInfo.is_superuser,
            role: userInfo.role,
            role_display: userInfo.role_display,
            assigned_region: userInfo.assigned_region,
            assigned_region_display: userInfo.assigned_region_display,
            permissions: userInfo.permissions || {},
          };
          secureStorage.setUser(userData);
          setUser(userData);
        } catch (userInfoError) {
          console.error("Error fetching user info:", userInfoError);
          // Fallback to basic user data if API fails
          const userData = {
            id: 1,
            username: username,
            name: username,
            role: "admin",
            permissions: {},
          };
          secureStorage.setUser(userData);
          setUser(userData);
        }

        return { success: true };
      } else {
        return { success: false, error: "No tokens received from server" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message || "Login failed. Please check your credentials.",
      };
    }
  };

  const logout = () => {
    setUser(null);
    // Clear secure storage
    secureStorage.clearAll();
    // Call logout API if needed
    logoutApi();
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
