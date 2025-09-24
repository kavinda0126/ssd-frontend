import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} dirty - The potentially unsafe HTML string
 * @param {Object} options - DOMPurify configuration options
 * @returns {string} - Sanitized HTML string
 */
export const sanitizeHTML = (dirty, options = {}) => {
  const defaultOptions = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['class', 'id'],
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  };

  const config = { ...defaultOptions, ...options };
  return DOMPurify.sanitize(dirty, config);
};

/**
 * Sanitizes HTML for PDF generation (more restrictive)
 * @param {string} dirty - The potentially unsafe HTML string
 * @returns {string} - Sanitized HTML string safe for PDF
 */
export const sanitizeForPDF = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'strong', 'p', 'br', 'div', 'span', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['style'],
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'iframe'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'href', 'src']
  });
};

/**
 * Creates a safe DOM element with text content
 * @param {string} tagName - The HTML tag name
 * @param {string} content - The text content (will be escaped)
 * @param {Object} attributes - Key-value pairs of attributes to set
 * @returns {HTMLElement} - The created DOM element
 */
export const createSafeElement = (tagName, content = '', attributes = {}) => {
  const element = document.createElement(tagName);
  
  // Use textContent to prevent XSS
  if (content) {
    element.textContent = content;
  }
  
  // Safely set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    // Whitelist safe attributes
    const safeAttributes = [
      'class', 'id', 'style', 'data-*', 'aria-*', 'role',
      'src', 'alt', 'width', 'height', 'title', 'type', 'name', 'value'
    ];
    const isSafe = safeAttributes.some(attr => 
      attr.endsWith('*') ? key.startsWith(attr.slice(0, -1)) : key === attr
    );
    
    if (isSafe && typeof value === 'string') {
      element.setAttribute(key, value);
    }
  });
  
  return element;
};

/**
 * Safely sets HTML content using DOMPurify
 * @param {HTMLElement} element - The target element
 * @param {string} htmlContent - The HTML content to set
 */
export const setSafeHTML = (element, htmlContent) => {
  const sanitized = sanitizeHTML(htmlContent);
  element.innerHTML = sanitized;
};

/**
 * Validates and sanitizes form data from server responses
 * @param {string} responseHTML - HTML response from server
 * @returns {string} - Sanitized HTML safe for DOM insertion
 */
export const sanitizeServerResponse = (responseHTML) => {
  return DOMPurify.sanitize(responseHTML, {
    ALLOWED_TAGS: ['form', 'input', 'button', 'label', 'div', 'p'],
    ALLOWED_ATTR: ['type', 'name', 'value', 'action', 'method', 'class', 'id', 'for'],
    FORBID_SCRIPT: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit']
  });
};

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text safe for HTML insertion
 */
export const escapeHTML = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};