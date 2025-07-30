import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { UserPlus, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface TestResult {
  email: string;
  success: boolean;
  error?: string;
  timestamp: string;
}

const TestAccountGenerator = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { signUp } = useAuth();

  const generateTestEmail = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `test.${timestamp}.${random}@unclutterai.test`;
  };

  const testSignUp = async (testEmail: string): Promise<TestResult> => {
    const startTime = new Date().toISOString();
    
    try {
      console.log(`🧪 Testing sign-up for: ${testEmail}`);
      
      const { error } = await signUp(testEmail, 'TestPass123!');
      
      if (error) {
        console.error(`❌ Test failed for ${testEmail}:`, error.message);
        return {
          email: testEmail,
          success: false,
          error: error.message,
          timestamp: startTime
        };
      } else {
        console.log(`✅ Test succeeded for ${testEmail}`);
        return {
          email: testEmail,
          success: true,
          timestamp: startTime
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`💥 Test exception for ${testEmail}:`, errorMessage);
      return {
        email: testEmail,
        success: false,
        error: errorMessage,
        timestamp: startTime
      };
    }
  };

  const runBatchTest = async () => {
    setTesting(true);
    setResults([]);
    
    const testEmails = Array.from({ length: 3 }, () => generateTestEmail());
    
    toast({
      title: "Starting Batch Test",
      description: `Testing ${testEmails.length} mock sign-ups...`,
    });

    for (const email of testEmails) {
      const result = await testSignUp(email);
      setResults(prev => [...prev, result]);
      
      // Small delay between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setTesting(false);
    
    const successful = results.filter(r => r.success).length + 1; // +1 for the last one
    const failed = testEmails.length - successful;
    
    toast({
      title: "Batch Test Complete",
      description: `${successful} succeeded, ${failed} failed`,
      variant: failed > 0 ? "destructive" : "default",
    });
  };

  const clearResults = () => {
    setResults([]);
  };

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 text-xs bg-white/90 backdrop-blur-sm border border-orange-200 hover:bg-orange-50"
      >
        <UserPlus className="w-4 h-4 mr-1" />
        Test Sign-ups
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="w-80 bg-white/95 backdrop-blur-sm border-orange-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Test Sign-ups
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={runBatchTest}
              disabled={testing}
              size="sm"
              className="flex-1"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {testing ? 'Testing...' : 'Run Test'}
            </Button>
            
            {results.length > 0 && (
              <Button
                onClick={clearResults}
                variant="outline"
                size="sm"
              >
                Clear
              </Button>
            )}
          </div>

          {results.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="text-xs font-medium text-gray-600">
                Results ({results.length})
              </div>
              
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-2 rounded-md border bg-gray-50/50 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="truncate font-mono text-gray-600">
                      {result.email.split('@')[0]}@...
                    </span>
                    <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
                      {result.success ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {result.success ? 'OK' : 'FAIL'}
                    </Badge>
                  </div>
                  
                  {result.error && (
                    <div className="text-red-600 text-xs truncate">
                      {result.error}
                    </div>
                  )}
                  
                  <div className="text-gray-500 text-xs">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Tests use mock emails and temporary accounts
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestAccountGenerator;