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

export const registerBiometric = async (userId: string, userName: string) => {
  const challengeArray = crypto.getRandomValues(new Uint8Array(32));
  const challenge = btoa(String.fromCharCode(...challengeArray));

  const registrationOptions = {
    rp: {
      name: 'UnclutterAI',
      id: window.location.hostname,
    },
    user: {
      id: btoa(userId),
      name: userName,
      displayName: userName,
    },
    challenge,
    pubKeyCredParams: [{ alg: -7, type: 'public-key' as const }],
    authenticatorSelection: {
      authenticatorAttachment: 'platform' as const,
      userVerification: 'required' as const,
    },
    timeout: 60000,
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
  const challengeArray = crypto.getRandomValues(new Uint8Array(32));
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
    return { success: true, result: authenticationResult };
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return { success: false, error };
  }
};