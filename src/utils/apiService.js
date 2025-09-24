/**
 * API Utility with CSRF Protection
 * Provides convenient methods for making API calls with automatic CSRF protection
 */

import csrfService from './csrfService';

class APIService {
  constructor() {
    this.baseURL = process.env.React_App_Backend_URL;
  }

  /**
   * Generic API call method with CSRF protection
   * @param {string} endpoint - API endpoint (relative to base URL)
   * @param {object} options - Request options
   * @returns {Promise<any>} Parsed JSON response
   */
  async apiCall(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await csrfService.fetchWithCSRFRetry(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Try to parse JSON, fallback to text if not JSON
    try {
      return await response.json();
    } catch (error) {
      return await response.text();
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {object} headers - Additional headers
   * @returns {Promise<any>} Parsed JSON response
   */
  async get(endpoint, headers = {}) {
    return this.apiCall(endpoint, {
      method: 'GET',
      headers,
    });
  }

  /**
   * POST request with CSRF protection
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @param {object} headers - Additional headers
   * @returns {Promise<any>} Parsed JSON response
   */
  async post(endpoint, data = {}, headers = {}) {
    return this.apiCall(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request with CSRF protection
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @param {object} headers - Additional headers
   * @returns {Promise<Response>} Fetch response
   */
  async put(endpoint, data = {}, headers = {}) {
    return this.apiCall(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request with CSRF protection
   * @param {string} endpoint - API endpoint
   * @param {object} headers - Additional headers
   * @returns {Promise<Response>} Fetch response
   */
  async delete(endpoint, headers = {}) {
    return this.apiCall(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  /**
   * PATCH request with CSRF protection
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body data
   * @param {object} headers - Additional headers
   * @returns {Promise<Response>} Fetch response
   */
  async patch(endpoint, data = {}, headers = {}) {
    return this.apiCall(endpoint, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  }

  /**
   * Upload file with CSRF protection
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with file
   * @param {object} additionalHeaders - Additional headers (excluding Content-Type for FormData)
   * @returns {Promise<Response>} Fetch response
   */
  async uploadFile(endpoint, formData, additionalHeaders = {}) {
    try {
      const token = await csrfService.getCSRFToken();
      
      const headers = {
        'X-CSRF-Token': token,
        ...additionalHeaders,
        // Don't set Content-Type for FormData - browser will set it with boundary
      };

      const url = `${this.baseURL}${endpoint}`;
      
      return fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error uploading file with CSRF:', error);
      throw error;
    }
  }

  /**
   * Convenience method for login requests (without CSRF protection)
   * @param {string} endpoint - Login endpoint
   * @param {object} credentials - Login credentials
   * @returns {Promise<object>} Parsed JSON response
   */
  async login(endpoint, credentials) {
    try {
      // Login doesn't need CSRF protection since user doesn't have a session yet
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // For session cookies
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
       const msg = errorData.message || errorData.error || `Login failed: ${response.status}`;
        const err = new Error(msg);
        err.status = response.status;
        err.data = errorData;
        throw err;
      }
      
      return response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Convenience method for registration requests (without CSRF protection)
   * @param {string} endpoint - Registration endpoint
   * @param {object} userData - User registration data
   * @returns {Promise<object>} Parsed JSON response
   */
  async register(endpoint, userData) {
    try {
      // Registration doesn't need CSRF protection since user doesn't have a session yet
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // For session cookies
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Registration failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Handle logout and clear CSRF token
   * @param {string} endpoint - Logout endpoint (optional)
   * @returns {Promise<void>}
   */
  async logout(endpoint = null) {
    try {
      if (endpoint) {
        await this.post(endpoint);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with client-side cleanup even if API fails
    } finally {
      // Always clear CSRF token on logout
      csrfService.clearToken();
    }
  }

  /**
   * Initialize CSRF token (call this at app startup)
   * @returns {Promise<void>}
   */
  async initializeCSRF() {
    try {
      await csrfService.getCSRFToken();
    } catch (error) {
      alert("Failed to initialize CSRF token.");
      // App can still work without CSRF token, just less secure
    }
  }
}

// Create singleton instance
const apiService = new APIService();

export default apiService;

// Export convenience methods
export const {
  get,
  post,
  put,
  delete: deleteRequest,
  patch,
  uploadFile,
  login,
  register,
  logout,
  initializeCSRF
} = apiService;