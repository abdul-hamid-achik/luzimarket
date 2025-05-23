// Utility for secure token storage with obfuscated keys
class SecureStorage {
    constructor() {
        // Obfuscated keys - using base64 encoding for the key names
        this.keys = {
            accessToken: btoa('_luzi_auth_access'), // _luzi_auth_access -> X2x1emlfYXV0aF9hY2Nlc3M=
            refreshToken: btoa('_luzi_auth_refresh'), // _luzi_auth_refresh -> X2x1emlfYXV0aF9yZWZyZXNo
        };
    }

    // Set access token
    setAccessToken(token) {
        if (token) {
            sessionStorage.setItem(this.keys.accessToken, token);
        }
    }

    // Get access token
    getAccessToken() {
        return sessionStorage.getItem(this.keys.accessToken);
    }

    // Set refresh token
    setRefreshToken(token) {
        if (token) {
            sessionStorage.setItem(this.keys.refreshToken, token);
        }
    }

    // Get refresh token
    getRefreshToken() {
        return sessionStorage.getItem(this.keys.refreshToken);
    }

    // Set both tokens
    setTokens({ accessToken, refreshToken }) {
        if (accessToken) this.setAccessToken(accessToken);
        if (refreshToken) this.setRefreshToken(refreshToken);
    }

    // Get both tokens
    getTokens() {
        return {
            accessToken: this.getAccessToken(),
            refreshToken: this.getRefreshToken()
        };
    }

    // Clear all tokens
    clearTokens() {
        sessionStorage.removeItem(this.keys.accessToken);
        sessionStorage.removeItem(this.keys.refreshToken);
    }

    // Check if user has valid tokens
    hasTokens() {
        return !!(this.getAccessToken() && this.getRefreshToken());
    }

    // Check if user has access token (for authentication state)
    hasAccessToken() {
        return !!this.getAccessToken();
    }
}

// Export singleton instance
export const secureStorage = new SecureStorage(); 