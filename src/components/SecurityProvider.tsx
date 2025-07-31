/**
 * Security Provider for global security context and monitoring
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeCSRFToken, validateOrigin } from '@/lib/csrfProtection';
import { enhancedAuthRateLimiter } from '@/lib/rateLimiter';
import { securityMonitor } from '@/lib/security';

interface SecurityContextType {
  csrfToken: string;
  isSecureEnvironment: boolean;
  suspiciousIPs: string[];
  refreshSecurityState: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isSecureEnvironment, setIsSecureEnvironment] = useState<boolean>(false);
  const [suspiciousIPs, setSuspiciousIPs] = useState<string[]>([]);

  useEffect(() => {
    // Initialize security measures
    const token = initializeCSRFToken();
    setCsrfToken(token);

    // Check secure environment
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost';
    setIsSecureEnvironment(isSecure);

    // Monitor for security events
    const securityInterval = setInterval(() => {
      const ips = enhancedAuthRateLimiter.getSuspiciousIPs();
      setSuspiciousIPs(ips);

      // Log suspicious activity
      if (ips.length > 0) {
        securityMonitor.logEvent({
          type: 'security_alert',
          metadata: { 
            suspicious_ips: ips.length,
            alert_type: 'rate_limit_exceeded'
          }
        });
      }
    }, 30000); // Check every 30 seconds

    // Validate page origin on load
    if (!validateOrigin()) {
      securityMonitor.logEvent({
        type: 'security_alert',
        metadata: { 
          alert_type: 'invalid_origin',
          referrer: document.referrer,
          current_origin: window.location.origin
        }
      });
    }

    // Monitor for potential XSS attempts
    const monitorDOM = () => {
      const suspiciousElements = document.querySelectorAll('script[src*="javascript:"], iframe[src*="javascript:"]');
      if (suspiciousElements.length > 0) {
        securityMonitor.logEvent({
          type: 'security_alert',
          metadata: { 
            alert_type: 'potential_xss',
            elements_found: suspiciousElements.length
          }
        });
      }
    };

    // Run DOM monitoring every 10 seconds
    const domInterval = setInterval(monitorDOM, 10000);

    return () => {
      clearInterval(securityInterval);
      clearInterval(domInterval);
    };
  }, []);

  const refreshSecurityState = () => {
    const newToken = initializeCSRFToken();
    setCsrfToken(newToken);
    
    const ips = enhancedAuthRateLimiter.getSuspiciousIPs();
    setSuspiciousIPs(ips);
  };

  const value: SecurityContextType = {
    csrfToken,
    isSecureEnvironment,
    suspiciousIPs,
    refreshSecurityState
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};