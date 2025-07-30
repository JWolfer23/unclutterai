import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AuthDebugger = () => {
  const [testEmail, setTestEmail] = useState("test@example.com");
  const [testPassword, setTestPassword] = useState("Unclutter123!!");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (result: any) => {
    setResults(prev => [{ timestamp: new Date().toISOString(), ...result }, ...prev]);
  };

  const checkDatabaseState = async () => {
    try {
      // Check if we can access profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);
      
      // Check if we can access tokens table
      const { data: tokens, error: tokensError } = await supabase
        .from('tokens')
        .select('*')
        .limit(5);
      
      addResult({
        test: 'Database State Check',
        status: (!profilesError && !tokensError) ? 'SUCCESS' : 'MIXED',
        profilesCount: profiles?.length || 0,
        tokensCount: tokens?.length || 0,
        profilesError: profilesError?.message,
        tokensError: tokensError?.message
      });
    } catch (err) {
      addResult({
        test: 'Database State Check',
        status: 'FAILED',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  const runSignUpWithProfileCheck = async () => {
    setLoading(true);
    console.log('🧪 Starting sign-up with profile verification...');
    
    try {
      // First, sign out any existing session
      await supabase.auth.signOut();
      
      const email = `debug+${Date.now()}@example.com`;
      console.log('📧 Testing with email:', email);
      
      // Step 1: Sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: testPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (signUpError) {
        addResult({
          test: 'Sign-up with Profile Check',
          status: 'SIGNUP_FAILED',
          error: signUpError.message,
          step: 'signup'
        });
        return;
      }
      
      const userId = signUpData.user?.id;
      if (!userId) {
        addResult({
          test: 'Sign-up with Profile Check',
          status: 'NO_USER_ID',
          step: 'signup'
        });
        return;
      }
      
      // Step 2: Wait a moment for trigger to execute
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Check if profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // Step 4: Check if tokens record was created
      const { data: tokens, error: tokensError } = await supabase
        .from('tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      addResult({
        test: 'Sign-up with Profile Check',
        status: (!profileError && !tokensError && profile && tokens) ? 'SUCCESS' : 'PARTIAL_SUCCESS',
        userId,
        hasProfile: !!profile,
        hasTokens: !!tokens,
        profileError: profileError?.message,
        tokensError: tokensError?.message,
        profileData: profile,
        tokensData: tokens
      });
      
    } catch (err) {
      addResult({
        test: 'Sign-up with Profile Check',
        status: 'ERROR',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testSignInFlow = async () => {
    setLoading(true);
    console.log('🔐 Testing sign-in flow...');
    
    try {
      // First, let's create a test user
      const email = `signin+${Date.now()}@example.com`;
      console.log('📧 Creating test user:', email);
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: testPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (signUpError) {
        addResult({
          test: 'Sign-in Flow Test',
          status: 'SIGNUP_FAILED',
          error: signUpError.message,
          step: 'signup'
        });
        return;
      }
      
      addResult({
        test: 'Sign-in Flow Test - Step 1',
        status: 'SIGNUP_SUCCESS',
        userId: signUpData.user?.id,
        emailConfirmed: signUpData.user?.email_confirmed_at !== null,
        step: 'signup'
      });
      
      // Wait a moment then try to sign in
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔑 Attempting sign-in with same credentials...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: testPassword
      });
      
      addResult({
        test: 'Sign-in Flow Test - Step 2',
        status: signInError ? 'SIGNIN_FAILED' : 'SUCCESS',
        error: signInError?.message,
        hasSession: !!signInData.session,
        step: 'signin'
      });
      
    } catch (err) {
      addResult({
        test: 'Sign-in Flow Test',
        status: 'ERROR',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testMultipleSignUps = async () => {
    setLoading(true);
    console.log('🧪 Testing multiple sign-ups...');
    
    const testCount = 3;
    const results = [];
    
    for (let i = 0; i < testCount; i++) {
      const email = `batch+${Date.now()}+${i}@example.com`;
      console.log(`📧 Testing ${i + 1}/${testCount} with email:`, email);
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: testPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        
        results.push({
          test: `Batch Sign-up ${i + 1}`,
          status: error ? 'FAILED' : 'SUCCESS',
          email,
          userId: data.user?.id,
          error: error?.message
        });
        
        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        results.push({
          test: `Batch Sign-up ${i + 1}`,
          status: 'ERROR',
          email,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
    
    // Add all results
    results.forEach(result => addResult(result));
    
    const successCount = results.filter(r => r.status === 'SUCCESS').length;
    toast({
      title: "Batch Test Complete",
      description: `${successCount}/${testCount} sign-ups succeeded`,
      variant: successCount === testCount ? "default" : "destructive"
    });
    
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔍 Authentication Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Test Email</label>
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Test Password</label>
            <Input
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="Unclutter123!!"
            />
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={runSignUpWithProfileCheck}
            disabled={loading}
            variant="default"
          >
            🧪 Test Sign-up + DB Check
          </Button>
          <Button 
            onClick={testSignInFlow}
            disabled={loading}
            variant="default"
          >
            🔑 Test Sign-in Flow
          </Button>
          <Button 
            onClick={testMultipleSignUps}
            disabled={loading}
            variant="outline"
          >
            🔄 Test 3 Sign-ups
          </Button>
          <Button 
            onClick={checkDatabaseState}
            disabled={loading}
            variant="outline"
          >
            🗄️ Check Database State
          </Button>
          <Button 
            onClick={clearResults}
            variant="destructive"
            size="sm"
          >
            Clear Results
          </Button>
        </div>
        
        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h3 className="font-medium">Test Results:</h3>
            {results.map((result, index) => (
              <div 
                key={index}
                className={`p-3 border rounded text-sm ${
                  result.status === 'SUCCESS' ? 'bg-green-50 border-green-200' :
                  result.status === 'FAILED' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="font-medium">{result.test}</div>
                <div className="text-xs text-gray-500">{result.timestamp}</div>
                <div className="mt-1">
                  <strong>Status:</strong> {result.status}
                  {result.error && <div><strong>Error:</strong> {result.error}</div>}
                  {result.userId && <div><strong>User ID:</strong> {result.userId}</div>}
                  {result.email && <div><strong>Email:</strong> {result.email}</div>}
                  {result.hasProfile !== undefined && <div><strong>Has Profile:</strong> {result.hasProfile ? '✅' : '❌'}</div>}
                  {result.hasTokens !== undefined && <div><strong>Has Tokens:</strong> {result.hasTokens ? '✅' : '❌'}</div>}
                  {result.profilesCount !== undefined && <div><strong>Profiles Count:</strong> {result.profilesCount}</div>}
                  {result.tokensCount !== undefined && <div><strong>Tokens Count:</strong> {result.tokensCount}</div>}
                  {result.profileError && <div><strong>Profile Error:</strong> {result.profileError}</div>}
                  {result.tokensError && <div><strong>Tokens Error:</strong> {result.tokensError}</div>}
                  {result.note && <div><strong>Note:</strong> {result.note}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthDebugger;