/**
 * CSRF Protection Service
 * Handles CSRF token fetching, storage, and automatic inclusion in API requests
 */

class CSRFService {
  constructor() {
    this.csrfToken = null;
    this.tokenExpiry = null;
    this.fetchPromise = null; // To prevent multiple simultaneous token fetches
  }

  /**
   * Fetch CSRF token from the backend
   * @returns {Promise<string>} CSRF token
   */
  async fetchCSRFToken() {
    try {
      const response = await fetch(`${process.env.React_App_Backend_URL}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include', // Include cookies for session
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      this.csrfToken = data.csrfToken;
      this.tokenExpiry = Date.now() + (30 * 60 * 1000); // Token valid for 30 minutes
      
      return this.csrfToken;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      throw error;
    }
  }

  /**
   * Get valid CSRF token (fetch new one if needed)
   * @returns {Promise<string>} CSRF token
   */
  async getCSRFToken() {
    // If token exists and hasn't expired, return it
    if (this.csrfToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.csrfToken;
    }

    // If already fetching token, wait for it
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Fetch new token
    this.fetchPromise = this.fetchCSRFToken();
    
    try {
      const token = await this.fetchPromise;
      this.fetchPromise = null;
      return token;
    } catch (error) {
      this.fetchPromise = null;
      throw error;
    }
  }

  /**
   * Clear stored CSRF token (useful for logout)
   */
  clearToken() {
    this.csrfToken = null;
    this.tokenExpiry = null;
    this.fetchPromise = null;
  }

  /**
   * Get headers with CSRF token for API requests
   * @param {object} additionalHeaders - Additional headers to include
   * @returns {Promise<object>} Headers object with CSRF token
   */
  async getHeadersWithCSRF(additionalHeaders = {}) {
    try {
      const token = await this.getCSRFToken();
      
      return {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        ...additionalHeaders,
      };
    } catch (error) {
      console.error('Error getting CSRF headers:', error);
      // Return headers without CSRF token if fetch fails
      return {
        'Content-Type': 'application/json',
        ...additionalHeaders,
      };
    }
  }

  /**
   * Enhanced fetch wrapper with automatic CSRF token inclusion
   * @param {string} url - Request URL
   * @param {object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async fetchWithCSRF(url, options = {}) {
    const { headers = {}, method = 'GET', ...restOptions } = options;
    
    // Only add CSRF token for state-changing requests
    const needsCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
    
    let finalHeaders = { ...headers };
    
    if (needsCSRF) {
      try {
        const csrfHeaders = await this.getHeadersWithCSRF(headers);
        finalHeaders = csrfHeaders;
      } catch (error) {
        console.warn('Failed to get CSRF token, proceeding without it:', error);
      }
    }

    return fetch(url, {
      method,
      headers: finalHeaders,
      credentials: 'include', // Always include cookies for session management
      ...restOptions,
    });
  }

  /**
   * Retry a request with fresh CSRF token if it fails with 403
   * @param {string} url - Request URL
   * @param {object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async fetchWithCSRFRetry(url, options = {}) {
    try {
      const response = await this.fetchWithCSRF(url, options);
      
      // If request fails with 403 (likely CSRF token issue), retry with fresh token
      if (response.status === 403) {
        alert("Session expired. Please try again.");
        this.clearToken(); // Clear cached token
        return this.fetchWithCSRF(url, options);
      }
      
      return response;
    } catch (error) {
      console.error('Error in CSRF fetch with retry:', error);
      throw error;
    }
  }
}

// Create singleton instance
const csrfService = new CSRFService();

export default csrfService;

// Export convenience methods
export const {
  getCSRFToken,
  getHeadersWithCSRF,
  fetchWithCSRF,
  fetchWithCSRFRetry,
  clearToken
} = csrfService;