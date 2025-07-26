
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { registerBiometric, authenticateWithBiometric, checkBiometricSupport } from "@/lib/webauthn";
import { securityMonitor, authRateLimiter, validateEmail, validatePassword } from "@/lib/security";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id || 'no user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    // Input validation
    if (!validateEmail(email)) {
      const error = new Error('Invalid email format');
      securityMonitor.logEvent({
        type: 'auth_failure',
        metadata: { reason: 'invalid_email', email: email.substring(0, 3) + '***' }
      });
      return { error };
    }

    if (!validatePassword(password)) {
      const error = new Error('Password does not meet security requirements');
      securityMonitor.logEvent({
        type: 'auth_failure',
        metadata: { reason: 'weak_password', email: email.substring(0, 3) + '***' }
      });
      return { error };
    }

    // Rate limiting
    if (!authRateLimiter.isAllowed(email)) {
      const error = new Error('Too many signup attempts. Please try again later.');
      return { error };
    }

    securityMonitor.logEvent({
      type: 'auth_attempt',
      metadata: { action: 'signup', email: email.substring(0, 3) + '***' }
    });

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      securityMonitor.logEvent({
        type: 'auth_failure',
        metadata: { action: 'signup', reason: error.message, email: email.substring(0, 3) + '***' }
      });
    } else {
      securityMonitor.logEvent({
        type: 'auth_success',
        metadata: { action: 'signup', email: email.substring(0, 3) + '***' }
      });
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Input validation
    if (!validateEmail(email)) {
      const error = new Error('Invalid email format');
      securityMonitor.logEvent({
        type: 'auth_failure',
        metadata: { reason: 'invalid_email', email: email.substring(0, 3) + '***' }
      });
      return { error };
    }

    // Rate limiting
    if (!authRateLimiter.isAllowed(email)) {
      const error = new Error('Too many signin attempts. Please try again later.');
      return { error };
    }

    securityMonitor.logEvent({
      type: 'auth_attempt',
      metadata: { action: 'signin', email: email.substring(0, 3) + '***' }
    });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      securityMonitor.logEvent({
        type: 'auth_failure',
        metadata: { action: 'signin', reason: error.message, email: email.substring(0, 3) + '***' }
      });
    } else {
      securityMonitor.logEvent({
        type: 'auth_success',
        userId: user?.id,
        metadata: { action: 'signin', email: email.substring(0, 3) + '***' }
      });
      // Reset rate limiter on successful login
      authRateLimiter.reset(email);
    }
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const registerBiometricAuth = async () => {
    if (!user || !session) return { error: new Error('User not logged in') };
    
    try {
      securityMonitor.logEvent({
        type: 'biometric_attempt',
        userId: user.id,
        metadata: { action: 'register' }
      });

      const { success, credential, error } = await registerBiometric(user.id, user.email || 'User');
      
      if (success && credential) {
        // Store credential securely via edge function
        const { error: storeError } = await supabase.functions.invoke('biometric-auth', {
          body: {
            action: 'register',
            credentialData: {
              id: credential.id,
              publicKey: credential.response.publicKey,
              counter: 0
            },
            userId: user.id
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (storeError) {
          securityMonitor.logEvent({
            type: 'auth_failure',
            userId: user.id,
            metadata: { action: 'biometric_register', reason: storeError.message }
          });
          throw storeError;
        }

        securityMonitor.logEvent({
          type: 'auth_success',
          userId: user.id,
          metadata: { action: 'biometric_register' }
        });
        
        return { success: true };
      } else {
        securityMonitor.logEvent({
          type: 'auth_failure',
          userId: user.id,
          metadata: { action: 'biometric_register', reason: error?.message || 'Unknown error' }
        });
        return { error: error || new Error('Failed to register biometric') };
      }
    } catch (error) {
      securityMonitor.logEvent({
        type: 'auth_failure',
        userId: user.id,
        metadata: { action: 'biometric_register', reason: error instanceof Error ? error.message : 'Unknown error' }
      });
      return { error };
    }
  };

  const signInWithBiometric = async () => {
    if (!session) return { error: new Error('No active session') };
    
    try {
      // Check if user has biometric credential in their metadata
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser?.user_metadata?.biometric_credential) {
        return { error: new Error('No biometric credential found') };
      }

      securityMonitor.logEvent({
        type: 'biometric_attempt',
        userId: currentUser.id,
        metadata: { action: 'authenticate' }
      });

      const credentialId = currentUser.user_metadata.biometric_credential.id;
      const { success, result, error } = await authenticateWithBiometric(credentialId);
      
      if (success && result) {
        // Verify server-side via edge function
        const { data, error: verifyError } = await supabase.functions.invoke('biometric-auth', {
          body: {
            action: 'verify',
            credentialData: result
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (verifyError || !data?.success) {
          securityMonitor.logEvent({
            type: 'auth_failure',
            userId: currentUser.id,
            metadata: { action: 'biometric_authenticate', reason: 'server_verification_failed' }
          });
          return { error: new Error('Biometric verification failed') };
        }

        securityMonitor.logEvent({
          type: 'auth_success',
          userId: currentUser.id,
          metadata: { action: 'biometric_authenticate' }
        });
        
        return { success: true };
      } else {
        securityMonitor.logEvent({
          type: 'auth_failure',
          userId: currentUser.id,
          metadata: { action: 'biometric_authenticate', reason: error?.message || 'Unknown error' }
        });
        return { error: error || new Error('Biometric authentication failed') };
      }
    } catch (error) {
      securityMonitor.logEvent({
        type: 'auth_failure',
        metadata: { action: 'biometric_authenticate', reason: error instanceof Error ? error.message : 'Unknown error' }
      });
      return { error };
    }
  };

  const isBiometricSupported = async () => {
    return await checkBiometricSupport();
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    registerBiometricAuth,
    signInWithBiometric,
    isBiometricSupported,
  };
};
