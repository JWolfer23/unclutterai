import { useState, useEffect } from "react";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { validateEmail, getPasswordStrength } from "@/lib/security";
import { supabase } from "@/integrations/supabase/client";
import logoTransparent from "@/assets/logo-transparent.png";
import { setToastsSuppressed } from "@/lib/toastSafety";
import { Mail, ArrowLeft } from "lucide-react";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const { signIn, signUp } = useAuth();

  // Suppress toasts during auth flow
  useEffect(() => {
    setToastsSuppressed(true);
  }, []);

  /** Handle Login or Sign Up */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email.",
        description: "",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const { score } = getPasswordStrength(password);
      if (score < 75) {
        toast({
          title: "Password too weak.",
          description: "Minimum 12 characters with mixed case, numbers, symbols.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    } else {
      if (password.length < 12) {
        toast({
          title: "Password too short.",
          description: "Minimum 12 characters.",
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
          title: "Authentication failed.",
          description: result.error.message,
          variant: "destructive",
        });
      } else if (isSignUp) {
        toast({
          title: "Confirmation sent.",
          description: "Check your email.",
        });
      } else {
        toast({
          title: "Signed in.",
          description: "",
        });
      }
    } catch (error) {
      toast({
        title: "Error occurred.",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /** OAuth handlers */
  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) {
        toast({
          title: "Authentication failed.",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error occurred.",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  /** Password Reset */
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    if (!validateEmail(resetEmail)) {
      toast({
        title: "Invalid email.",
        description: "",
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
          title: "Error.",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email sent.",
          description: "Check your inbox.",
        });
        setResetDialogOpen(false);
        setResetEmail("");
      }
    } finally {
      setResetLoading(false);
    }
  };

  // Email form view
  if (showEmailForm) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pb-10 pt-20 relative overflow-hidden bg-[#08080F]">
        {/* Ambient glow effects */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#3B82F6]/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-[#A855F7]/15 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="w-full max-w-[440px] relative animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Glass card */}
          <div className="backdrop-blur-2xl bg-[#12121F]/95 border border-white/[0.1] rounded-3xl shadow-2xl shadow-[#6366F1]/10">
            <CardHeader className="text-center space-y-6 pt-10 pb-2">
              {/* Back button */}
              <button
                onClick={() => setShowEmailForm(false)}
                className="absolute top-6 left-6 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-white/60" />
              </button>

              {/* Logo */}
              <div className="w-20 h-20 mx-auto flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl shadow-lg">
                <img src={logoTransparent} alt="UnclutterAI" className="w-14 h-14 object-contain" />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  {isSignUp ? "Create your account" : "Sign in with email"}
                </h1>
                <p className="text-sm text-white/50 font-medium">
                  {isSignUp ? "Join UnclutterAI today" : "Enter your credentials to continue"}
                </p>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-10">
              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white/70">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    placeholder="you@example.com"
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-13 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#3B82F6]/50 focus:ring-[#3B82F6]/20 transition-all"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-white/70">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    required
                    minLength={12}
                    placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-13 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#3B82F6]/50 focus:ring-[#3B82F6]/20 transition-all"
                  />
                </div>

                {isSignUp && password && <PasswordStrengthMeter password={password} className="mt-2" />}

                {/* Forgot password */}
                {!isSignUp && (
                  <div className="text-right">
                    <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-sm font-medium text-[#A855F7]/80 hover:text-[#A855F7] transition-colors"
                        >
                          Forgot password?
                        </button>
                      </DialogTrigger>

                      <DialogContent className="bg-[#0D0D1A] border-white/10">
                        <DialogHeader>
                          <DialogTitle className="text-white">Reset your password</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handlePasswordReset} className="space-y-4">
                          <Label htmlFor="resetEmail" className="text-white/70">Email address</Label>
                          <Input
                            id="resetEmail"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="bg-white/5 border-white/10 text-white"
                          />

                          <Button type="submit" className="w-full" disabled={resetLoading}>
                            {resetLoading ? "Sending..." : "Send reset email"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full h-14 mt-4 rounded-2xl font-semibold text-white text-base bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#A855F7] hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#6366F1]/25"
                  disabled={loading}
                >
                  {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
                </button>
              </form>

              {/* Toggle sign up / sign in */}
              <div className="mt-8 text-center">
                <span className="text-sm text-white/40">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="ml-2 text-sm font-semibold text-[#A855F7] hover:text-[#C084FC] transition-colors"
                >
                  {isSignUp ? "Sign in" : "Create one"}
                </button>
              </div>
            </CardContent>
          </div>
        </div>
      </div>
    );
  }

  // Main welcome view
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pb-10 pt-20 relative overflow-hidden bg-[#08080F]">
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#3B82F6]/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-[#A855F7]/15 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="w-full max-w-[440px] relative animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Glass card */}
        <div className="backdrop-blur-2xl bg-[#12121F]/95 border border-white/[0.1] rounded-3xl shadow-2xl shadow-[#6366F1]/10">
          <CardHeader className="text-center space-y-6 pt-12 pb-2">
            {/* Logo */}
            <div className="w-24 h-24 mx-auto flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl shadow-lg">
              <img src={logoTransparent} alt="UnclutterAI" className="w-16 h-16 object-contain" />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white/95 to-white/80 bg-clip-text text-transparent">
                Welcome to UnclutterAI
              </h1>
              <p className="text-base text-white/50 font-medium">
                Your personal operating system
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-10 pt-6">
            {/* Primary CTA - Continue with email */}
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full h-14 rounded-2xl font-semibold text-white text-base bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#A855F7] hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#6366F1]/25 flex items-center justify-center gap-3"
            >
              <Mail className="w-5 h-5" />
              Continue with email
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span className="text-xs text-white/35 uppercase tracking-widest font-medium">or sign in with</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3">
              {/* Google */}
              <button
                onClick={() => handleOAuthSignIn('google')}
                className="w-full h-14 rounded-2xl font-medium text-white/90 text-base bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/15 backdrop-blur-sm active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Apple */}
              <button
                onClick={() => handleOAuthSignIn('apple')}
                className="w-full h-14 rounded-2xl font-medium text-white/90 text-base bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/15 backdrop-blur-sm active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleOAuthSignIn('facebook')}
                className="w-full h-14 rounded-2xl font-medium text-white/90 text-base bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/15 backdrop-blur-sm active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </button>
            </div>

            {/* Terms */}
            <p className="mt-8 text-center text-xs text-white/30 leading-relaxed">
              By continuing, you agree to our{" "}
              <a href="#" className="text-white/50 hover:text-white/70 underline underline-offset-2 transition-colors">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-white/50 hover:text-white/70 underline underline-offset-2 transition-colors">Privacy Policy</a>
            </p>
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
