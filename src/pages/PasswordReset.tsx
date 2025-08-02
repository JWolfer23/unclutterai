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
  const [loading, setLoading] = useState(false);
  const [recoveryTokens, setRecoveryTokens] = useState<{accessToken: string, refreshToken: string} | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleRecoverySession = async () => {
      // Check for recovery session from URL hash or search params
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      const type = hashParams.get('type') || searchParams.get('type');
      
      console.log('Recovery params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
      
      if (accessToken && refreshToken && type === 'recovery') {
        try {
          setLoading(true);
          // Immediately set the session with the tokens from the recovery link
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Session error:', error);
            toast({
              title: "Invalid reset link",
              description: "This password reset link is invalid or has expired.",
              variant: "destructive",
            });
            navigate('/auth');
          } else {
            console.log('Recovery session set successfully');
            setRecoveryTokens({ accessToken, refreshToken });
          }
        } catch (error) {
          console.error('Recovery error:', error);
          toast({
            title: "Invalid reset link",
            description: "This password reset link is invalid or has expired.",
            variant: "destructive",
          });
          navigate('/auth');
        } finally {
          setLoading(false);
        }
      } else {
        // No valid recovery tokens found
        toast({
          title: "Invalid reset link",
          description: "This password reset link is invalid or has expired.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleRecoverySession();
  }, [searchParams, navigate, toast]);

  const isPasswordValid = password.length >= 12;
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recoveryTokens) {
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
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
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