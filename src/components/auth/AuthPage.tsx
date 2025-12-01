import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import logoTransparent from "@/assets/logo-transparent.png";
import { fadeInUp, primaryGradientButton, whiteSurfaceButton } from "@/ui/styles";

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

  /** Check Face ID availability */
  useEffect(() => {
    const check = async () => {
      const supported = await isBiometricSupported();
      setBiometricSupported(supported);
    };
    check();
  }, [isBiometricSupported]);

  /** Handle Login or Sign Up */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    /** Password logic */
    if (isSignUp) {
      const { score } = getPasswordStrength(password);
      if (score < 75) {
        toast({
          title: "Password Too Weak",
          description: "Please choose a stronger password (12+ characters with mixed case, numbers, and symbols).",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    } else {
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

    try {
      const result = isSignUp ? await signUp(email, password) : await signIn(email, password);

      if (result.error) {
        toast({
          title: "Authentication Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else if (isSignUp) {
        toast({
          title: "Check your email",
          description: "We just sent you a confirmation link.",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You're now signed in.",
        });
      }
    } catch (error) {
      toast({
        title: "Unexpected Error",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /** Face ID / Biometrics */
  const handleBiometricSignIn = async () => {
    setBiometricLoading(true);
    try {
      const { success, error } = await signInWithBiometric();
      if (error) {
        toast({
          title: "Face ID Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (success) {
        toast({
          title: "Success",
          description: "Signed in with Face ID",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Face ID could not be completed.",
        variant: "destructive",
      });
    }
    setBiometricLoading(false);
  };

  /** Password Reset */
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
          title: "Email Sent",
          description: "Check your inbox for the reset link.",
        });
        setResetDialogOpen(false);
        setResetEmail("");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pb-10 pt-20">
      <div className={`w-full max-w-[420px] glass-card glass-card--primary ${fadeInUp}`}>
        <CardHeader className="text-center space-y-4">
          {/* Logo in dark rounded square */}
          <div className="w-28 h-28 mx-auto flex items-center justify-center bg-black/90 rounded-3xl shadow-lg">
            <img src={logoTransparent} alt="UnclutterAI Logo" className="w-24 h-24 object-contain" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold leading-tight bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent">
            Welcome to UnclutterAI
          </h1>

          <p className="text-sm text-white/60 font-medium">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </p>
        </CardHeader>

        <CardContent>
          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Email */}
            <Input
              id="email"
              type="email"
              value={email}
              placeholder="Enter your email"
              required
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-white text-black shadow-inner font-medium"
            />

            {/* Password */}
            <Input
              id="password"
              type="password"
              value={password}
              required
              minLength={12}
              placeholder={isSignUp ? "Create a strong password (12+ chars)" : "Enter your password"}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl bg-white text-black shadow-inner font-medium"
            />

            {isSignUp && password && <PasswordStrengthMeter password={password} className="mt-2" />}

            {/* Forgot password */}
            {!isSignUp && (
              <div className="text-right mt-1">
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="text-sm font-semibold text-[#A855F7] hover:text-[#C084FC] transition-colors">
                      Forgot your password?
                    </button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset your password</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <Label htmlFor="resetEmail">Email address</Label>
                      <Input
                        id="resetEmail"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />

                      <Button type="submit" className="w-full" disabled={resetLoading}>
                        {resetLoading ? "Sending..." : "Send reset email"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Sign In / Sign up Button */}
            <button type="submit" className={`${primaryGradientButton} mt-6`} disabled={loading}>
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          {/* Face ID */}
          {!isSignUp && biometricSupported && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/40 uppercase tracking-wide">Or continue with</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                type="button"
                className={`${whiteSurfaceButton} gap-2`}
                onClick={handleBiometricSignIn}
                disabled={biometricLoading}
              >
                <Fingerprint className="w-5 h-5" />
                {biometricLoading ? "Authenticating..." : "Sign in with Face ID"}
              </button>
            </div>
          )}

          {/* Sign up / Sign in toggle */}
          <div className="mt-6 text-center text-sm font-medium text-white/70">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#A855F7] font-semibold hover:text-[#C084FC] transition-colors"
            >
              {isSignUp ? "Sign in instead" : "Create an account"}
            </button>
          </div>
        </CardContent>
      </div>
    </div>
  );
};

export default AuthPage;
