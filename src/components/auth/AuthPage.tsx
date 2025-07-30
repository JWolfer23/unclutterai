
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Fingerprint } from "lucide-react";
import DeviceInfoOverlay from "@/components/debug/DeviceInfoOverlay";
import TestAccountGenerator from "@/components/debug/TestAccountGenerator";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
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

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
      } else if (isSignUp) {
        toast({
          title: "Check your email",
          description: "Please check your email for the confirmation link.",
        });
      }
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <DeviceInfoOverlay />
      <TestAccountGenerator />
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                minLength={6}
              />
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
