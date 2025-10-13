// Secure Token Storage Utility
class SecureTokenStorage {
  constructor() {
    this.tokenKey = "auth_session";
    this.userKey = "user_session";
  }

  // Simple obfuscation (not encryption, but makes it less obvious)
  obfuscate(data) {
    return btoa(JSON.stringify(data));
  }

  deobfuscate(data) {
    try {
      return JSON.parse(atob(data));
    } catch {
      return null;
    }
  }

  // Store JWT tokens (access and refresh)
  setTokens(accessToken, refreshToken) {
    const tokenData = {
      access: accessToken,
      refresh: refreshToken,
      timestamp: Date.now(),
    };

    // Use sessionStorage instead of localStorage (cleared on browser close)
    sessionStorage.setItem(this.tokenKey, this.obfuscate(tokenData));
  }

  // Get access token
  getAccessToken() {
    try {
      const obfuscatedData = sessionStorage.getItem(this.tokenKey);
      if (!obfuscatedData) return null;

      const tokenData = this.deobfuscate(obfuscatedData);
      if (!tokenData) return null;

      return tokenData.access;
    } catch {
      this.clearToken();
      return null;
    }
  }

  // Get refresh token
  getRefreshToken() {
    try {
      const obfuscatedData = sessionStorage.getItem(this.tokenKey);
      if (!obfuscatedData) return null;

      const tokenData = this.deobfuscate(obfuscatedData);
      if (!tokenData) return null;

      return tokenData.refresh;
    } catch {
      this.clearToken();
      return null;
    }
  }

  // Update access token (after refresh)
  updateAccessToken(accessToken) {
    try {
      const obfuscatedData = sessionStorage.getItem(this.tokenKey);
      if (!obfuscatedData) return;

      const tokenData = this.deobfuscate(obfuscatedData);
      if (!tokenData) return;

      tokenData.access = accessToken;
      tokenData.timestamp = Date.now();

      sessionStorage.setItem(this.tokenKey, this.obfuscate(tokenData));
    } catch {
      this.clearToken();
    }
  }

  // Legacy method for backward compatibility
  getToken() {
    return this.getAccessToken();
  }

  // Store user data securely
  setUser(user) {
    sessionStorage.setItem(this.userKey, this.obfuscate(user));
  }

  // Get user data securely
  getUser() {
    try {
      const obfuscatedData = sessionStorage.getItem(this.userKey);
      if (!obfuscatedData) return null;

      return this.deobfuscate(obfuscatedData);
    } catch {
      this.clearUser();
      return null;
    }
  }

  // Clear token
  clearToken() {
    sessionStorage.removeItem(this.tokenKey);
  }

  // Clear user data
  clearUser() {
    sessionStorage.removeItem(this.userKey);
  }

  // Clear all auth data
  clearAll() {
    this.clearToken();
    this.clearUser();
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getAccessToken();
    const user = this.getUser();
    return !!(token && user);
  }
}

// Create singleton instance
const secureStorage = new SecureTokenStorage();

export default secureStorage;
