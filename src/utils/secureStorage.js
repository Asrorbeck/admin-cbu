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

  // Store token securely
  setToken(token) {
    const tokenData = {
      token: token,
      timestamp: Date.now(),
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    // Use sessionStorage instead of localStorage (cleared on browser close)
    sessionStorage.setItem(this.tokenKey, this.obfuscate(tokenData));
  }

  // Get token securely
  getToken() {
    try {
      const obfuscatedData = sessionStorage.getItem(this.tokenKey);
      if (!obfuscatedData) return null;

      const tokenData = this.deobfuscate(obfuscatedData);
      if (!tokenData) return null;

      // Check if token is expired
      if (Date.now() > tokenData.expires) {
        this.clearToken();
        return null;
      }

      return tokenData.token;
    } catch {
      this.clearToken();
      return null;
    }
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
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }
}

// Create singleton instance
const secureStorage = new SecureTokenStorage();

export default secureStorage;
