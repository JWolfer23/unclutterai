/**
 * Input sanitization utilities to prevent XSS and other security issues
 */

// HTML entities for escaping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Escape HTML characters to prevent XSS
 */
export const escapeHtml = (text: string): string => {
  if (typeof text !== 'string') return '';
  return text.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
};

/**
 * Sanitize and validate text input with length limits
 */
export const sanitizeTextInput = (
  input: string, 
  maxLength: number = 1000,
  allowNewlines: boolean = true
): string => {
  if (typeof input !== 'string') return '';
  
  // Remove null bytes and control characters except newlines/tabs
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove newlines if not allowed
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }
  
  // Trim whitespace and limit length
  sanitized = sanitized.trim().substring(0, maxLength);
  
  return sanitized;
};

/**
 * Validate and sanitize user note content
 */
export const sanitizeNoteContent = (content: string): string => {
  return sanitizeTextInput(content, 10000, true); // 10KB limit for notes
};

/**
 * Validate and sanitize user names/titles
 */
export const sanitizeUserInput = (input: string): string => {
  return sanitizeTextInput(input, 100, false); // 100 chars, no newlines
};

/**
 * Remove potentially dangerous URLs
 */
export const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') return '';
  
  // Allow only http/https URLs
  const urlPattern = /^https?:\/\/[^\s<>"'{}|\\^`[\]]+$/i;
  
  if (!urlPattern.test(url)) {
    return '';
  }
  
  return url.substring(0, 2048); // Limit URL length
};

/**
 * Sanitize object keys and values recursively
 */
export const sanitizeObject = (obj: any, maxDepth: number = 3): any => {
  if (maxDepth <= 0 || obj === null || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeTextInput(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.slice(0, 100).map(item => sanitizeObject(item, maxDepth - 1));
  }
  
  const sanitized: any = {};
  const keys = Object.keys(obj).slice(0, 50); // Limit object properties
  
  for (const key of keys) {
    const sanitizedKey = sanitizeTextInput(key, 50, false);
    if (sanitizedKey) {
      sanitized[sanitizedKey] = sanitizeObject(obj[key], maxDepth - 1);
    }
  }
  
  return sanitized;
};

/**
 * Rate limiting for client-side actions
 */
class ClientRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxAttempts: number;

  constructor(windowMs: number = 60000, maxAttempts: number = 5) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove expired attempts
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const formSubmissionLimiter = new ClientRateLimiter(60000, 3); // 3 attempts per minute
export const searchLimiter = new ClientRateLimiter(10000, 10); // 10 searches per 10 seconds