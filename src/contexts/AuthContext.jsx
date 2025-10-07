import { createContext, useContext, useState, useEffect } from "react";
import { loginApi, logoutApi } from "../utils/api";
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
    const savedToken = secureStorage.getToken();

    if (savedUser && savedToken) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await loginApi(username, password);

      if (response.token) {
        const userData = {
          id: 1, // You might want to get this from the API response
          username: username,
          name: username, // You might want to get this from the API response
          role: "admin", // You might want to get this from the API response
        };

        // Store token and user data securely
        secureStorage.setToken(response.token);
        secureStorage.setUser(userData);

        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: "No token received from server" };
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
