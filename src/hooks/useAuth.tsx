
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
    if (!user || !session) return { error: new Error('User not logged in') };
    
    try {
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
        
        if (storeError) throw storeError;
        return { success: true };
      } else {
        return { error: error || new Error('Failed to register biometric') };
      }
    } catch (error) {
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
          return { error: new Error('Biometric verification failed') };
        }
        
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
