/**
 * Client-side CSRF protection utilities
 */

// Generate a secure random token
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Store CSRF token in sessionStorage
export const setCSRFToken = (token: string): void => {
  sessionStorage.setItem('csrf_token', token);
};

// Get CSRF token from sessionStorage
export const getCSRFToken = (): string | null => {
  return sessionStorage.getItem('csrf_token');
};

// Initialize CSRF token for the session
export const initializeCSRFToken = (): string => {
  let token = getCSRFToken();
  if (!token) {
    token = generateCSRFToken();
    setCSRFToken(token);
  }
  return token;
};

// Validate request origin
export const validateOrigin = (allowedOrigins: string[] = []): boolean => {
  const currentOrigin = window.location.origin;
  const referrer = document.referrer;
  
  // Default allowed origins
  const defaultAllowed = [currentOrigin];
  const allowed = [...defaultAllowed, ...allowedOrigins];
  
  // Check if request comes from allowed origin
  if (referrer) {
    try {
      const referrerOrigin = new URL(referrer).origin;
      return allowed.includes(referrerOrigin);
    } catch {
      return false;
    }
  }
  
  return true; // Allow requests without referrer (direct navigation)
};

// Create headers with CSRF protection
export const createSecureHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  const csrfToken = getCSRFToken();
  
  return {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
    ...additionalHeaders
  };
};

// Validate form submission security
export const validateFormSubmission = (formElement: HTMLFormElement): boolean => {
  // Check if form has proper CSRF token
  const csrfInput = formElement.querySelector('input[name="csrf_token"]') as HTMLInputElement;
  if (csrfInput) {
    const formToken = csrfInput.value;
    const sessionToken = getCSRFToken();
    if (formToken !== sessionToken) {
      console.warn('CSRF token mismatch detected');
      return false;
    }
  }
  
  // Validate origin
  if (!validateOrigin()) {
    console.warn('Invalid request origin detected');
    return false;
  }
  
  return true;
};