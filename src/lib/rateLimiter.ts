/**
 * Enhanced rate limiting with IP tracking and progressive penalties
 */

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs: number;
}

interface AttemptRecord {
  timestamp: number;
  ipAddress?: string;
}

interface IPRecord {
  attempts: number[];
  isBlocked: boolean;
  blockExpiry?: number;
  penaltyLevel: number;
}

export class EnhancedRateLimiter {
  private attempts: Map<string, AttemptRecord[]> = new Map();
  private ipRecords: Map<string, IPRecord> = new Map();
  private suspiciousIPs: Set<string> = new Set();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  isAllowed(identifier: string, ipAddress?: string): boolean {
    const now = Date.now();

    // Check IP-level blocking first
    if (ipAddress && this.isIPBlocked(ipAddress, now)) {
      return false;
    }

    // Check identifier-level rate limiting
    const attempts = this.attempts.get(identifier) || [];
    const validAttempts = attempts.filter(
      attempt => now - attempt.timestamp < this.config.windowMs
    );

    if (validAttempts.length >= this.config.maxAttempts) {
      // Track IP if provided
      if (ipAddress) {
        this.recordSuspiciousIP(ipAddress, now);
      }
      return false;
    }

    // Record new attempt
    validAttempts.push({ timestamp: now, ipAddress });
    this.attempts.set(identifier, validAttempts);

    // Update IP tracking
    if (ipAddress) {
      this.updateIPRecord(ipAddress, now);
    }

    return true;
  }

  private isIPBlocked(ipAddress: string, now: number): boolean {
    const ipRecord = this.ipRecords.get(ipAddress);
    if (!ipRecord || !ipRecord.isBlocked) return false;

    if (ipRecord.blockExpiry && now > ipRecord.blockExpiry) {
      // Unblock expired IP
      ipRecord.isBlocked = false;
      ipRecord.blockExpiry = undefined;
      return false;
    }

    return true;
  }

  private recordSuspiciousIP(ipAddress: string, now: number): void {
    this.suspiciousIPs.add(ipAddress);
    
    const ipRecord = this.ipRecords.get(ipAddress) || {
      attempts: [],
      isBlocked: false,
      penaltyLevel: 0
    };

    ipRecord.penaltyLevel++;
    
    // Progressive blocking
    if (ipRecord.penaltyLevel >= 3) {
      ipRecord.isBlocked = true;
      ipRecord.blockExpiry = now + (this.config.blockDurationMs * ipRecord.penaltyLevel);
    }

    this.ipRecords.set(ipAddress, ipRecord);
  }

  private updateIPRecord(ipAddress: string, now: number): void {
    const ipRecord = this.ipRecords.get(ipAddress) || {
      attempts: [],
      isBlocked: false,
      penaltyLevel: 0
    };

    // Clean old attempts
    ipRecord.attempts = ipRecord.attempts.filter(
      timestamp => now - timestamp < this.config.windowMs * 10 // Keep longer history for IP tracking
    );
    
    ipRecord.attempts.push(now);
    this.ipRecords.set(ipAddress, ipRecord);

    // Detect multiple IP attack patterns
    if (ipRecord.attempts.length > this.config.maxAttempts * 2) {
      this.recordSuspiciousIP(ipAddress, now);
    }
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  clearSuspiciousIP(ipAddress: string): void {
    this.suspiciousIPs.delete(ipAddress);
    const ipRecord = this.ipRecords.get(ipAddress);
    if (ipRecord) {
      ipRecord.isBlocked = false;
      ipRecord.blockExpiry = undefined;
      ipRecord.penaltyLevel = 0;
    }
  }

  getSuspiciousIPs(): string[] {
    return Array.from(this.suspiciousIPs);
  }

  getIPStatus(ipAddress: string): { blocked: boolean; penaltyLevel: number; attempts: number } {
    const ipRecord = this.ipRecords.get(ipAddress);
    return {
      blocked: ipRecord?.isBlocked || false,
      penaltyLevel: ipRecord?.penaltyLevel || 0,
      attempts: ipRecord?.attempts.length || 0
    };
  }
}

// Enhanced rate limiters with IP tracking
export const enhancedAuthRateLimiter = new EnhancedRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  blockDurationMs: 30 * 60 * 1000 // 30 minutes initial block
});

export const enhancedAPIRateLimiter = new EnhancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxAttempts: 100,
  blockDurationMs: 5 * 60 * 1000 // 5 minutes
});

export const enhancedFormRateLimiter = new EnhancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxAttempts: 10,
  blockDurationMs: 2 * 60 * 1000 // 2 minutes
});