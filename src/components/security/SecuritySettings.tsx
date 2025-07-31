import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { authRateLimiter, biometricRateLimiter } from "@/lib/security";
import { Shield, Smartphone, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const SecuritySettings = () => {
  const { user, registerBiometricAuth, isBiometricSupported } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [checkingBiometric, setCheckingBiometric] = useState(false);

  const handleBiometricToggle = async (enabled: boolean) => {
    if (!enabled) {
      setBiometricEnabled(false);
      toast.info("Biometric authentication disabled");
      return;
    }

    setCheckingBiometric(true);
    try {
      const isSupported = await isBiometricSupported();
      if (!isSupported) {
        toast.error("Biometric authentication is not supported on this device");
        return;
      }

      const result = await registerBiometricAuth();
      if (result.error) {
        toast.error("Failed to enable biometric authentication: " + result.error.message);
      } else {
        setBiometricEnabled(true);
        toast.success("Biometric authentication enabled successfully");
      }
    } catch (error) {
      toast.error("Error setting up biometric authentication");
    } finally {
      setCheckingBiometric(false);
    }
  };

  const authPenalty = authRateLimiter.getPenaltyLevel(user?.email || '');
  const biometricPenalty = biometricRateLimiter.getPenaltyLevel(user?.id || '');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle>Security Settings</CardTitle>
          </div>
          <CardDescription>
            Manage your account security preferences and authentication methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <Label className="text-base">Biometric Authentication</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Use fingerprint or face recognition to sign in
              </p>
            </div>
            <Switch
              checked={biometricEnabled}
              onCheckedChange={handleBiometricToggle}
              disabled={checkingBiometric}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Session Timeout</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sign out after 24 hours of inactivity
              </p>
            </div>
            <Switch checked disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <CardTitle>Rate Limiting Status</CardTitle>
          </div>
          <CardDescription>
            Current penalty levels for authentication attempts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Authentication Penalty Level</span>
            <Badge variant={authPenalty > 0 ? "destructive" : "secondary"}>
              {authPenalty > 0 ? `Level ${authPenalty}` : "None"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Biometric Penalty Level</span>
            <Badge variant={biometricPenalty > 0 ? "destructive" : "secondary"}>
              {biometricPenalty > 0 ? `Level ${biometricPenalty}` : "None"}
            </Badge>
          </div>

          {(authPenalty > 0 || biometricPenalty > 0) && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="text-destructive font-medium">Security Penalties Active</p>
                <p className="text-muted-foreground">
                  Higher penalty levels result in longer wait times between authentication attempts.
                  Penalty levels reset after successful authentication.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
          <CardDescription>
            Important security configuration steps for Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Required Supabase Configuration:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground ml-4">
              <li>• Enable leaked password protection in Authentication settings</li>
              <li>• Set OTP expiry to 5-15 minutes maximum</li>
              <li>• Configure proper Site URL and Redirect URLs</li>
              <li>• Review and tighten RLS policies regularly</li>
            </ul>
          </div>
          
          <Button variant="outline" size="sm" asChild>
            <a 
              href="https://supabase.com/dashboard/project/aihlehujbzkkugzmcobn/auth/providers" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Open Supabase Auth Settings
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};