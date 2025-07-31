
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Fingerprint } from "lucide-react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { validateEmail, getPasswordStrength } from "@/lib/security";
import { supabase } from "@/integrations/supabase/client";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const { signIn, signUp, signInWithBiometric, isBiometricSupported } = useAuth();

  useEffect(() => {
    const checkBiometric = async () => {
      const supported = await isBiometricSupported();
      setBiometricSupported(supported);
    };
    checkBiometric();
  }, [isBiometricSupported]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Enhanced client-side validation
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const { score } = getPasswordStrength(password);
      if (score < 75) {
        toast({
          title: "Password Too Weak",
          description: "Please choose a stronger password (minimum 12 characters with mixed case, numbers, and symbols).",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    } else {
      // Enforce 12-character minimum for all password operations
      if (password.length < 12) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 12 characters long.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    console.log('🎯 Form submission:', { 
      isSignUp, 
      email: email.substring(0, 3) + '***',
      passwordLength: password.length 
    });

    try {
      const result = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      console.log('📱 Auth result:', { 
        hasError: !!result.error,
        hasData: !!(result as any).data,
        errorMessage: result.error?.message 
      });

      if (result.error) {
        console.error('🚨 Auth error in component:', result.error);
        toast({
          title: "Authentication Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else if (isSignUp) {
        console.log('✅ Sign-up success, showing email confirmation message');
        toast({
          title: "Check your email",
          description: "Please check your email for the confirmation link.",
        });
      } else {
        console.log('✅ Sign-in success');
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
      }
    } catch (error) {
      console.error('🚨 Unexpected error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricSignIn = async () => {
    setBiometricLoading(true);
    
    try {
      const { success, error } = await signInWithBiometric();
      
      if (error) {
        toast({
          title: "Face ID Authentication Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (success) {
        toast({
          title: "Success",
          description: "Signed in with Face ID",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred with Face ID",
        variant: "destructive",
      });
    } finally {
      setBiometricLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    if (!validateEmail(resetEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      setResetLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password reset email sent!",
          description: "Check your inbox for the password reset link.",
        });
        setResetDialogOpen(false);
        setResetEmail("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex flex-col items-center justify-center p-4 gap-6">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-md border-white/20 shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-200/50 bg-white/50 mx-auto mb-4">
            <img 
              src="/lovable-uploads/064ee60b-3850-4faa-abe4-7aefeedf9961.png" 
              alt="Unclutter Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome to UnclutterAI
          </CardTitle>
          <p className="text-gray-600">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {isSignUp && <span className="text-xs text-muted-foreground">(minimum 12 characters)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={isSignUp ? "Create a strong password (12+ chars)" : "Enter your password"}
                minLength={12}
                maxLength={128}
              />
              {isSignUp && password && (
                <PasswordStrengthMeter password={password} className="mt-2" />
              )}
              {!isSignUp && (
                <div className="mt-2">
                  <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="text-sm text-purple-600 p-0 h-auto">
                        Forgot your password?
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reset your password</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="resetEmail">Email address</Label>
                          <Input
                            id="resetEmail"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Enter your email address"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={resetLoading}>
                          {resetLoading ? "Sending..." : "Send reset email"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              disabled={loading}
            >
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>
          
          {!isSignUp && biometricSupported && (
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4 border-purple-200 hover:bg-purple-50"
                onClick={handleBiometricSignIn}
                disabled={biometricLoading}
              >
                <Fingerprint className="w-4 h-4 mr-2" />
                {biometricLoading ? "Authenticating..." : "Sign in with Face ID"}
              </Button>
            </div>
          )}
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-purple-600"
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Sign up"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
