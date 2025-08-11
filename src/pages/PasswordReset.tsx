import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PasswordReset = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionSet, setSessionSet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyTokenAndSetSession = async () => {
      try {
        // First try to get code from URL params (new approach)
        const code = searchParams.get('code');
        
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            setError('Invalid or expired reset token');
            toast({
              title: "Invalid reset link",
              description: "This password reset link is invalid or has expired.",
              variant: "destructive",
            });
            setTimeout(() => navigate('/auth'), 3000);
            return;
          }
          
          setSessionSet(true);
          setLoading(false);
          return;
        }

        // Fallback to hash-based approach (legacy)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        if (accessToken && type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: "",
          });
          
          if (error) {
            setError('Invalid or expired reset token');
            toast({
              title: "Invalid reset link",
              description: "This password reset link is invalid or has expired.",
              variant: "destructive",
            });
            setTimeout(() => navigate('/auth'), 3000);
          } else {
            setSessionSet(true);
          }
        } else {
          setError('No reset token found');
          toast({
            title: "Invalid reset link",
            description: "This password reset link is invalid or has expired.",
            variant: "destructive",
          });
          setTimeout(() => navigate('/auth'), 3000);
        }
      } catch (err) {
        console.error('Error verifying reset token:', err);
        setError('Failed to verify reset token');
        toast({
          title: "Error",
          description: "Failed to verify reset token. Please try again.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/auth'), 3000);
      } finally {
        setLoading(false);
      }
    };

    verifyTokenAndSetSession();
  }, [navigate, toast, searchParams]);

  const isPasswordValid = password.length >= 12;
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionSet) {
      toast({
        title: "Invalid session",
        description: "No valid recovery session found. Please try again.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    if (!isPasswordValid) {
      toast({
        title: "Password too short",
        description: "Password must be at least 12 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Update the password (session is already set from useEffect)
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) {
        toast({
          title: "Error updating password",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password successfully updated",
          description: "Redirecting to dashboard...",
        });
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      toast({
        title: "Unexpected error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // If there's an error or token verification failed, show error UI
  if (error && !sessionSet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-destructive">Reset Link Invalid</CardTitle>
            <CardDescription className="text-center">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              This password reset link is invalid or has expired.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If still loading token verification, show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Verifying Reset Token</CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your reset link...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Set New Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              <PasswordStrengthMeter password={password} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-sm text-destructive">Passwords don't match</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !isPasswordValid || !passwordsMatch}
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordReset;