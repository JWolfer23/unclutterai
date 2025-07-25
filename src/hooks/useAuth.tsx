
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { registerBiometric, authenticateWithBiometric, checkBiometricSupport } from "@/lib/webauthn";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const registerBiometricAuth = async () => {
    if (!user) return { error: new Error('User not logged in') };
    
    try {
      const { success, credential, error } = await registerBiometric(user.id, user.email || 'User');
      
      if (success && credential) {
        // Store credential ID in user metadata
        const { error: updateError } = await supabase.auth.updateUser({
          data: { biometric_credential_id: credential.id }
        });
        
        if (updateError) throw updateError;
        return { success: true };
      } else {
        return { error: error || new Error('Failed to register biometric') };
      }
    } catch (error) {
      return { error };
    }
  };

  const signInWithBiometric = async () => {
    try {
      // Get stored credential from user's session or localStorage
      const storedCredentialId = localStorage.getItem('biometric_credential_id');
      if (!storedCredentialId) {
        return { error: new Error('No biometric credential found') };
      }

      const { success, result, error } = await authenticateWithBiometric(storedCredentialId);
      
      if (success && result) {
        // Create a custom session or sign in the user
        // For now, we'll store the credential verification in localStorage
        // In a production app, you'd verify this server-side
        localStorage.setItem('biometric_verified', 'true');
        return { success: true };
      } else {
        return { error: error || new Error('Biometric authentication failed') };
      }
    } catch (error) {
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
