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

  const runSimpleSignUp = async () => {
    setLoading(true);
    console.log('🧪 Starting simple sign-up test...');
    
    try {
      // First, try to sign out any existing session
      await supabase.auth.signOut();
      
      const email = `test+${Date.now()}@example.com`;
      console.log('📧 Testing with email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password: testPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      console.log('📊 Sign-up result:', { data, error });
      
      if (error) {
        addResult({
          test: 'Simple Sign-up',
          status: 'FAILED',
          error: error.message,
          details: error
        });
        toast({
          title: "Sign-up Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        addResult({
          test: 'Simple Sign-up',
          status: 'SUCCESS',
          userId: data.user?.id,
          hasSession: !!data.session,
          email: data.user?.email
        });
        
        // Wait a moment then check if profile was created
        setTimeout(async () => {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user?.id)
              .single();
              
            addResult({
              test: 'Profile Check',
              status: profileError ? 'FAILED' : 'SUCCESS',
              profile,
              error: profileError?.message
            });
          } catch (err) {
            addResult({
              test: 'Profile Check',
              status: 'FAILED',
              error: 'Profile check failed'
            });
          }
        }, 2000);
        
        toast({
          title: "Sign-up Success",
          description: `User created: ${data.user?.id}`,
        });
      }
    } catch (err) {
      console.error('🚨 Unexpected error:', err);
      addResult({
        test: 'Simple Sign-up',
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

  const checkDatabaseTrigger = async () => {
    try {
      // Just add a note that the trigger should be checked manually
      addResult({
        test: 'Database Trigger Check',
        status: 'MANUAL_CHECK_NEEDED',
        note: 'Check Supabase logs to verify handle_new_user trigger is executing'
      });
    } catch (err) {
      addResult({
        test: 'Database Trigger Check',
        status: 'FAILED',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
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
            onClick={runSimpleSignUp}
            disabled={loading}
            variant="outline"
          >
            🧪 Test Single Sign-up
          </Button>
          <Button 
            onClick={testMultipleSignUps}
            disabled={loading}
            variant="outline"
          >
            🔄 Test 3 Sign-ups
          </Button>
          <Button 
            onClick={checkDatabaseTrigger}
            disabled={loading}
            variant="outline"
          >
            🗄️ Check DB Trigger
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