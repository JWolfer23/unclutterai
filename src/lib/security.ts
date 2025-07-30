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
  // At least 8 characters, with uppercase, lowercase, number, and special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Content sanitization
export const sanitizeHtml = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// Rate limiting utilities
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private ipAttempts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}

  isAllowed(identifier: string, ipAddress?: string): boolean {
    const now = Date.now();
    
    // Check identifier-based rate limiting
    const record = this.attempts.get(identifier);
    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
    } else {
      if (record.count >= this.maxAttempts) {
        securityMonitor.logEvent({
          type: 'rate_limit_exceeded',
          metadata: { identifier, attempts: record.count, type: 'identifier' }
        });
        return false;
      }
      record.count++;
    }

    // Check IP-based rate limiting if provided
    if (ipAddress) {
      const ipRecord = this.ipAttempts.get(ipAddress);
      if (!ipRecord || now > ipRecord.resetTime) {
        this.ipAttempts.set(ipAddress, { count: 1, resetTime: now + this.windowMs });
      } else {
        if (ipRecord.count >= this.maxAttempts * 2) { // More lenient for IP
          securityMonitor.logEvent({
            type: 'rate_limit_exceeded',
            metadata: { identifier: ipAddress, attempts: ipRecord.count, type: 'ip' }
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
}

export const authRateLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes
export const biometricRateLimiter = new RateLimiter(3, 60000); // 3 attempts per minute
