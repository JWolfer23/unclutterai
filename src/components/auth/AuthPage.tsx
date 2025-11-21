
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
import logoNew from "@/assets/logo-new.png";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-[hsl(220,20%,8%)] to-[hsl(220,20%,5%)] border border-white/10 rounded-[28px] shadow-[0_0_80px_-12px_rgba(168,85,247,0.5),0_20px_60px_-8px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <CardHeader className="text-center pt-10 pb-6 space-y-4">
          {/* Logo on dark rounded square */}
          <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[hsl(220,20%,12%)] to-[hsl(220,20%,8%)] border border-white/10 shadow-lg mx-auto flex items-center justify-center p-3">
            <img 
              src={logoNew} 
              alt="Unclutter AI Logo"
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Heading with gradient */}
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent leading-tight">
              Welcome to UnclutterAI
            </CardTitle>
            <p className="text-sm text-white/60 font-medium">
              {isSignUp ? "Create your account" : "Sign in to your account"}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="h-12 bg-white border-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] rounded-xl text-gray-900 placeholder:text-gray-400 font-medium"
              />
            </div>
            
            {/* Password Input */}
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={isSignUp ? "Create a strong password (12+ chars)" : "Enter your password"}
                minLength={12}
                maxLength={128}
                className="h-12 bg-white border-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] rounded-xl text-gray-900 placeholder:text-gray-400 font-medium"
              />
              {isSignUp && password && (
                <PasswordStrengthMeter password={password} className="mt-2" />
              )}
              
              {/* Forgot Password Link */}
              {!isSignUp && (
                <div className="mt-2">
                  <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-sm text-[#8B5CF6] hover:text-[#A855F7] font-semibold transition-colors">
                        Forgot your password?
                      </button>
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
            
            {/* Primary Sign In Button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-[#3B82F6] to-[#A855F7] hover:from-[#2563EB] hover:to-[#9333EA] text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30"
              disabled={loading}
            >
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>
          
          {/* Face ID Section */}
          {!isSignUp && biometricSupported && (
            <div className="mt-6 space-y-4">
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
                  <span className="bg-[hsl(220,20%,6%)] px-3 text-white/40">Or continue with</span>
                </div>
              </div>
              
              {/* Face ID Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 bg-white hover:bg-gray-50 border-0 rounded-xl text-gray-900 font-semibold shadow-md transition-all"
                onClick={handleBiometricSignIn}
                disabled={biometricLoading}
              >
                <Fingerprint className="w-5 h-5 mr-2" />
                {biometricLoading ? "Authenticating..." : "Sign in with Face ID"}
              </Button>
            </div>
          )}
          
          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-white/70 font-medium"
            >
              {isSignUp 
                ? <>Already have an account? <span className="text-[#8B5CF6] font-bold hover:text-[#A855F7] transition-colors">Sign in</span></> 
                : <>Don't have an account? <span className="text-[#8B5CF6] font-bold hover:text-[#A855F7] transition-colors">Sign up</span></>
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
