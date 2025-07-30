
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
    console.log('🔐 Sign-up attempt started', { 
      email: email.substring(0, 3) + '***',
      password: password.length + ' chars',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    });

    // Input validation
    if (!validateEmail(email)) {
      const error = new Error('Invalid email format');
      console.error('❌ Validation failed: Invalid email format');
      securityMonitor.logEvent({
        type: 'auth_failure',
        metadata: { reason: 'invalid_email', email: email.substring(0, 3) + '***' }
      });
      return { error };
    }

    if (!validatePassword(password)) {
      const error = new Error('Password does not meet security requirements (minimum 6 characters, mix of letters and numbers)');
      console.error('❌ Validation failed: Weak password');
      securityMonitor.logEvent({
        type: 'auth_failure',
        metadata: { reason: 'weak_password', email: email.substring(0, 3) + '***' }
      });
      return { error };
    }

    // Rate limiting
    if (!authRateLimiter.isAllowed(email)) {
      const error = new Error('Too many signup attempts. Please try again later.');
      console.warn('⚠️ Rate limit exceeded for email:', email.substring(0, 3) + '***');
      return { error };
    }

    securityMonitor.logEvent({
      type: 'auth_attempt',
      metadata: { action: 'signup', email: email.substring(0, 3) + '***' }
    });

    const redirectUrl = `${window.location.origin}/`;
    console.log('🔗 Using redirect URL:', redirectUrl);
    
    try {
      console.log('🚀 Calling supabase.auth.signUp with:', {
        email: email.substring(0, 3) + '***',
        passwordLength: password.length,
        redirectUrl
      });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      console.log('📊 Complete Supabase signUp response:', {
        hasData: !!data,
        hasUser: !!data?.user,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        hasSession: !!data?.session,
        sessionId: data?.session?.access_token?.substring(0, 10) + '...',
        hasError: !!error,
        errorCode: error?.status,
        errorMessage: error?.message,
        fullError: error
      });
      
      if (error) {
        console.error('🚨 Sign-up error details:', {
          message: error.message,
          status: error.status,
          fullError: error
        });

        // Enhanced error categorization
        let friendlyMessage = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
          friendlyMessage = 'Sign-up failed: Invalid credentials. Please check your email and password format.';
          console.error('🔍 Invalid credentials error - this might be a configuration issue');
        } else if (error.message.includes('Database error')) {
          friendlyMessage = 'Database connection issue. Please try again in a moment.';
          console.error('🗄️ Database error during signup:', error);
        } else if (error.message.includes('User already registered')) {
          friendlyMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.message.includes('Invalid email')) {
          friendlyMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Password')) {
          friendlyMessage = 'Password requirements not met. Use at least 6 characters.';
        } else if (error.status === 429) {
          friendlyMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.status >= 500) {
          friendlyMessage = 'Server error. Please try again or contact support if the issue persists.';
          console.error('🚨 Server error during signup:', error);
        }
        
        const enhancedError = new Error(friendlyMessage);
        (enhancedError as any).originalError = error;
        
        securityMonitor.logEvent({
          type: 'auth_failure',
          metadata: { 
            action: 'signup', 
            reason: error.message, 
            status: error.status,
            email: email.substring(0, 3) + '***' 
          }
        });
        
        return { error: enhancedError };
      } else {
        console.log('✅ Sign-up successful for user:', data?.user?.id);
        console.log('📧 User confirmation required:', !data?.session);
        securityMonitor.logEvent({
          type: 'auth_success',
          metadata: { action: 'signup', email: email.substring(0, 3) + '***' }
        });
      }
      
      return { data, error };
    } catch (networkError) {
      console.error('🌐 Network error during signup:', networkError);
      const friendlyError = new Error('Network connection issue. Please check your internet connection and try again.');
      (friendlyError as any).originalError = networkError;
      
      securityMonitor.logEvent({
        type: 'auth_failure',
        metadata: { 
          action: 'signup', 
          reason: 'network_error',
          email: email.substring(0, 3) + '***' 
        }
      });
      
      return { error: friendlyError };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Sign-in attempt started', { 
      email: email.substring(0, 3) + '***',
      password: password.length + ' chars',
      timestamp: new Date().toISOString()
    });

    // Input validation
    if (!validateEmail(email)) {
      const error = new Error('Invalid email format');
      console.error('❌ Sign-in validation failed: Invalid email format');
      securityMonitor.logEvent({
        type: 'auth_failure',
        metadata: { reason: 'invalid_email', email: email.substring(0, 3) + '***' }
      });
      return { error };
    }

    // Rate limiting
    if (!authRateLimiter.isAllowed(email)) {
      const error = new Error('Too many signin attempts. Please try again later.');
      console.warn('⚠️ Sign-in rate limit exceeded for email:', email.substring(0, 3) + '***');
      return { error };
    }

    securityMonitor.logEvent({
      type: 'auth_attempt',
      metadata: { action: 'signin', email: email.substring(0, 3) + '***' }
    });

    console.log('🚀 Calling supabase.auth.signInWithPassword...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('📊 Complete Supabase signIn response:', {
        hasData: !!data,
        hasUser: !!data?.user,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        emailConfirmed: data?.user?.email_confirmed_at !== null,
        hasSession: !!data?.session,
        sessionId: data?.session?.access_token?.substring(0, 10) + '...',
        hasError: !!error,
        errorCode: error?.status,
        errorMessage: error?.message,
        fullError: error
      });
      
      if (error) {
        console.error('🚨 Sign-in error details:', {
          message: error.message,
          status: error.status,
          fullError: error
        });

        let friendlyMessage = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
          friendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
          console.error('🔍 Invalid credentials - could be unconfirmed email or wrong password');
        } else if (error.message.includes('Email not confirmed')) {
          friendlyMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('User not found')) {
          friendlyMessage = 'No account found with this email. Please sign up first.';
        }
        
        const enhancedError = new Error(friendlyMessage);
        (enhancedError as any).originalError = error;
        
        securityMonitor.logEvent({
          type: 'auth_failure',
          metadata: { action: 'signin', reason: error.message, email: email.substring(0, 3) + '***' }
        });
        
        return { error: enhancedError };
      } else {
        console.log('✅ Sign-in successful for user:', data?.user?.id);
        securityMonitor.logEvent({
          type: 'auth_success',
          userId: data?.user?.id,
          metadata: { action: 'signin', email: email.substring(0, 3) + '***' }
        });
        // Reset rate limiter on successful login
        authRateLimiter.reset(email);
      }
      
      return { data, error };
    } catch (networkError) {
      console.error('🌐 Network error during sign-in:', networkError);
      const friendlyError = new Error('Network connection issue. Please check your internet connection and try again.');
      (friendlyError as any).originalError = networkError;
      
      securityMonitor.logEvent({
        type: 'auth_failure',
        metadata: { 
          action: 'signin', 
          reason: 'network_error',
          email: email.substring(0, 3) + '***' 
        }
      });
      
      return { error: friendlyError };
    }
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
