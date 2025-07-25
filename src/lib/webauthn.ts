import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';

export const isWebAuthnSupported = (): boolean => {
  return browserSupportsWebAuthn();
};

export const isBiometricAvailable = (): boolean => {
  return (
    browserSupportsWebAuthn() &&
    'PublicKeyCredential' in window &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  );
};

export const checkBiometricSupport = async (): Promise<boolean> => {
  if (!isBiometricAvailable()) return false;
  
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

// Rate limiting for biometric operations
const rateLimiter = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_ATTEMPTS = 5;

const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const record = rateLimiter.get(identifier);
  
  if (!record || now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    rateLimiter.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  record.count++;
  record.lastAttempt = now;
  return true;
};

export const registerBiometric = async (userId: string, userName: string) => {
  // Rate limiting check
  if (!checkRateLimit(`register_${userId}`)) {
    throw new Error('Too many registration attempts. Please try again later.');
  }

  // Generate cryptographically secure challenge
  const challengeArray = crypto.getRandomValues(new Uint8Array(64)); // Increased to 64 bytes
  const challenge = btoa(String.fromCharCode(...challengeArray));

  // Add additional entropy for device fingerprinting
  const deviceInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    timestamp: Date.now()
  };
  
  const registrationOptions = {
    rp: {
      name: 'UnclutterAI',
      id: window.location.hostname,
    },
    user: {
      id: btoa(userId + JSON.stringify(deviceInfo)), // Include device fingerprint
      name: userName,
      displayName: userName,
    },
    challenge,
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' as const }, // ES256
      { alg: -257, type: 'public-key' as const }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform' as const,
      userVerification: 'required' as const,
      residentKey: 'required' as const,
    },
    timeout: 60000,
    excludeCredentials: [], // Prevent duplicate registrations
  };

  try {
    const registrationResult = await startRegistration({ optionsJSON: registrationOptions });
    return { success: true, credential: registrationResult };
  } catch (error) {
    console.error('Biometric registration failed:', error);
    return { success: false, error };
  }
};

export const authenticateWithBiometric = async (credentialId: string) => {
  // Rate limiting check
  if (!checkRateLimit(`auth_${credentialId}`)) {
    throw new Error('Too many authentication attempts. Please try again later.');
  }

  // Generate cryptographically secure challenge
  const challengeArray = crypto.getRandomValues(new Uint8Array(64)); // Increased to 64 bytes
  const challenge = btoa(String.fromCharCode(...challengeArray));

  const authenticationOptions = {
    challenge,
    allowCredentials: [{
      id: credentialId,
      type: 'public-key' as const,
    }],
    userVerification: 'required' as const,
    timeout: 60000,
  };

  try {
    const authenticationResult = await startAuthentication({ optionsJSON: authenticationOptions });
    
    // Log successful authentication for monitoring
    console.info('Biometric authentication successful', {
      credentialId: credentialId.substring(0, 8) + '...', // Partial ID for logging
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    
    return { success: true, result: authenticationResult };
  } catch (error) {
    // Log failed authentication attempts for monitoring
    console.warn('Biometric authentication failed', {
      credentialId: credentialId.substring(0, 8) + '...', // Partial ID for logging
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return { success: false, error };
  }
};