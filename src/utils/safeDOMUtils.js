import { sanitizeHTML, createSafeElement, sanitizeServerResponse } from './domSanitizer';

/**
 * Safely sets text content (prevents XSS)
 * @param {HTMLElement} element - Target element
 * @param {string} content - Text content to set
 */
export const safeSetContent = (element, content) => {
  if (!element || typeof content !== 'string') return;
  element.textContent = content;
};

/**
 * Safely appends sanitized HTML to a parent element
 * @param {HTMLElement} parent - Parent element
 * @param {string} htmlString - HTML string to append
 */
export const safeAppendHTML = (parent, htmlString) => {
  if (!parent || typeof htmlString !== 'string') return;
  
  const sanitized = sanitizeHTML(htmlString);
  const temp = document.createElement('div');
  temp.innerHTML = sanitized;
  
  // Move all child nodes from temp to parent
  while (temp.firstChild) {
    parent.appendChild(temp.firstChild);
  }
};

/**
 * Creates a safe header element for PDF generation
 * @param {string} title - Header title
 * @param {string} subtitle - Header subtitle
 * @param {Object} styles - CSS styles object
 * @returns {HTMLElement} - Safe header element
 */
export const createSafeHeader = (title, subtitle = '', styles = {}) => {
  const header = createSafeElement('div', '', { class: 'pdf-header' });
  
  if (title) {
    const titleElement = createSafeElement('h1', title, { class: 'pdf-title' });
    header.appendChild(titleElement);
  }
  
  if (subtitle) {
    const subtitleElement = createSafeElement('p', subtitle, { class: 'pdf-subtitle' });
    header.appendChild(subtitleElement);
  }
  
  // Apply safe styles
  Object.entries(styles).forEach(([property, value]) => {
    if (typeof value === 'string' && property.match(/^[a-zA-Z-]+$/)) {
      header.style[property] = value;
    }
  });
  
  return header;
};

/**
 * Creates a safe footer element for PDF generation
 * @param {string} content - Footer content
 * @param {Object} styles - CSS styles object
 * @returns {HTMLElement} - Safe footer element
 */
export const createSafeFooter = (content, styles = {}) => {
  const footer = createSafeElement('div', content, { class: 'pdf-footer' });
  
  // Apply safe styles
  Object.entries(styles).forEach(([property, value]) => {
    if (typeof value === 'string' && property.match(/^[a-zA-Z-]+$/)) {
      footer.style[property] = value;
    }
  });
  
  return footer;
};

/**
 * Safely replaces innerHTML usage with secure alternatives
 * @param {HTMLElement} element - Target element
 * @param {string} content - Content to set
 * @param {boolean} isHTML - Whether content contains HTML (will be sanitized)
 */
export const safeReplaceInnerHTML = (element, content, isHTML = false) => {
  if (!element) return;
  
  // Clear existing content
  element.innerHTML = '';
  
  if (isHTML) {
    safeAppendHTML(element, content);
  } else {
    safeSetContent(element, content);
  }
};

/**
 * Creates a safe wrapper element for PDF content
 * @param {string} className - CSS class name
 * @returns {HTMLElement} - Safe wrapper element
 */
export const createSafeWrapper = (className = '') => {
  return createSafeElement('div', '', { class: className });
};

/**
 * Safely clones an element and sanitizes its content
 * @param {HTMLElement} element - Element to clone
 * @returns {HTMLElement} - Sanitized cloned element
 */
export const safeCloneElement = (element) => {
  if (!element) return null;
  
  const clone = element.cloneNode(true);
  
  // Remove any potentially dangerous attributes
  const dangerousAttrs = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'];
  const walker = document.createTreeWalker(
    clone,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    dangerousAttrs.forEach(attr => {
      if (node.hasAttribute(attr)) {
        node.removeAttribute(attr);
      }
    });
  }
  
  return clone;
};

/**
 * Creates a safe form from server response data
 * @param {string} responseData - HTML response from payment gateway
 * @param {Object} options - DOMPurify configuration options
 * @returns {HTMLElement|null} - Safe form element or null if invalid
 */
export const createSafeFormFromResponse = (responseData, options = {}) => {
  if (!responseData || typeof responseData !== 'string') {
    console.error('Invalid response data for form creation');
    return null;
  }

  // Use sanitizeServerResponse function
  
  try {
    // Sanitize the response data
    const sanitizedHTML = sanitizeServerResponse(responseData);
    
    // Create a temporary container
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizedHTML;
    
    // Find the form element
    const form = tempDiv.querySelector('form');
    
    if (!form) {
      console.error('No form element found in payment response');
      return null;
    }
    
    // Additional validation for form attributes
    const action = form.getAttribute('action');
    const method = form.getAttribute('method');
    
    // Validate form action URL
    if (action) {
      try {
        const url = new URL(action);
        // Only allow HTTPS URLs for payment forms
        if (url.protocol !== 'https:') {
          console.error('Payment form action must use HTTPS');
          return null;
        }
      } catch (e) {
        console.error('Invalid form action URL:', action);
        return null;
      }
    }
    
    // Validate form method
    if (method && !['GET', 'POST'].includes(method.toUpperCase())) {
      console.error('Invalid form method:', method);
      return null;
    }
    
    // Remove the form from temp container and return it
    form.remove();
    return form;
    
  } catch (error) {
    console.error('Error creating safe form from response:', error);
    return null;
  }
};