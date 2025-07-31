// Security monitoring and logging utilities

interface SecurityEvent {
  type: 'auth_attempt' | 'auth_success' | 'auth_failure' | 'biometric_attempt' | 'rate_limit_exceeded';
  userId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000; // Keep last 1000 events in memory

  logEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.events.push(securityEvent);
    
    // Keep only the most recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Log to console for debugging (in production, this could be sent to a monitoring service)
    console.info('Security Event:', securityEvent);
  }

  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  getFailureRate(timeWindowMs: number = 300000): number { // 5 minutes default
    const cutoff = Date.now() - timeWindowMs;
    const recentEvents = this.events.filter(
      event => new Date(event.timestamp).getTime() > cutoff
    );
    
    const totalAttempts = recentEvents.filter(
      event => event.type.includes('attempt')
    ).length;
    
    const failures = recentEvents.filter(
      event => event.type.includes('failure')
    ).length;

    return totalAttempts > 0 ? failures / totalAttempts : 0;
  }

  detectSuspiciousActivity(): boolean {
    const failureRate = this.getFailureRate();
    const recentRateLimitEvents = this.events.filter(
      event => 
        event.type === 'rate_limit_exceeded' && 
        Date.now() - new Date(event.timestamp).getTime() < 60000 // Last minute
    ).length;

    return failureRate > 0.5 || recentRateLimitEvents > 5;
  }
}

export const securityMonitor = new SecurityMonitor();

// Input validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254 && email.length >= 5;
};

export const validatePassword = (password: string): boolean => {
  // Enhanced password requirements: at least 12 characters, with uppercase, lowercase, number, and special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
  return passwordRegex.test(password);
};

// Password strength scoring (0-100)
export const getPasswordStrength = (password: string): { score: number; feedback: string[] } => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 12) score += 25;
  else feedback.push(`Use at least 12 characters (current: ${password.length})`);

  if (/[a-z]/.test(password)) score += 15;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 15;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score += 15;
  else feedback.push('Add numbers');

  if (/[@$!%*?&]/.test(password)) score += 15;
  else feedback.push('Add special characters (@$!%*?&)');

  // Bonus points for additional complexity
  if (password.length >= 16) score += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 5;

  return { score: Math.min(score, 100), feedback };
};

// Content sanitization
export const sanitizeHtml = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// Enhanced rate limiting utilities with progressive penalties
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number; penalty: number }> = new Map();
  private ipAttempts: Map<string, { count: number; resetTime: number; penalty: number }> = new Map();
  private suspiciousIPs: Set<string> = new Set();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(identifier: string, ipAddress?: string): boolean {
    const now = Date.now();
    
    // Check for suspicious IP patterns
    if (ipAddress && this.suspiciousIPs.has(ipAddress)) {
      securityMonitor.logEvent({
        type: 'rate_limit_exceeded',
        metadata: { identifier: ipAddress, reason: 'suspicious_ip_blocked' }
      });
      return false;
    }
    
    // Check identifier-based rate limiting with progressive penalties
    const record = this.attempts.get(identifier);
    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs, penalty: 0 });
    } else {
      const adjustedLimit = Math.max(1, this.maxAttempts - record.penalty);
      if (record.count >= adjustedLimit) {
        // Increase penalty for repeat offenders
        record.penalty = Math.min(record.penalty + 1, 4);
        record.resetTime = now + (this.windowMs * Math.pow(2, record.penalty)); // Exponential backoff
        
        securityMonitor.logEvent({
          type: 'rate_limit_exceeded',
          metadata: { 
            identifier, 
            attempts: record.count, 
            penalty: record.penalty,
            type: 'identifier_progressive' 
          }
        });
        return false;
      }
      record.count++;
    }

    // Enhanced IP-based rate limiting
    if (ipAddress) {
      const ipRecord = this.ipAttempts.get(ipAddress);
      if (!ipRecord || now > ipRecord.resetTime) {
        this.ipAttempts.set(ipAddress, { count: 1, resetTime: now + this.windowMs, penalty: 0 });
      } else {
        const ipLimit = this.maxAttempts * 3; // More lenient for IP
        if (ipRecord.count >= ipLimit) {
          // Mark IP as suspicious after excessive attempts
          if (ipRecord.count >= ipLimit * 2) {
            this.suspiciousIPs.add(ipAddress);
          }
          
          ipRecord.penalty = Math.min(ipRecord.penalty + 1, 6);
          ipRecord.resetTime = now + (this.windowMs * Math.pow(2, ipRecord.penalty));
          
          securityMonitor.logEvent({
            type: 'rate_limit_exceeded',
            metadata: { 
              identifier: ipAddress, 
              attempts: ipRecord.count, 
              penalty: ipRecord.penalty,
              type: 'ip_progressive',
              marked_suspicious: this.suspiciousIPs.has(ipAddress)
            }
          });
          return false;
        }
        ipRecord.count++;
      }
    }

    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  // Clear suspicious IP marking (for administrative use)
  clearSuspiciousIP(ipAddress: string): void {
    this.suspiciousIPs.delete(ipAddress);
    this.ipAttempts.delete(ipAddress);
  }

  // Get current penalty level for identifier
  getPenaltyLevel(identifier: string): number {
    const record = this.attempts.get(identifier);
    return record?.penalty || 0;
  }
}

export const authRateLimiter = new RateLimiter(3, 300000); // 3 attempts per 5 minutes (tightened)
export const biometricRateLimiter = new RateLimiter(2, 120000); // 2 attempts per 2 minutes (tightened)

// Additional specialized rate limiters
export const passwordResetRateLimiter = new RateLimiter(2, 900000); // 2 password resets per 15 minutes
export const apiRateLimiter = new RateLimiter(10, 60000); // 10 API calls per minute
