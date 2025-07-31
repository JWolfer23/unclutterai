import { useState, useEffect } from "react";
import { securityMonitor } from "@/lib/security";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Activity, Clock, User, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const SecurityDashboard = () => {
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadSecurityEvents();
  }, [refreshKey]);

  const loadSecurityEvents = () => {
    const events = securityMonitor.getRecentEvents(20);
    setRecentEvents(events);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'auth_success': return <Shield className="w-4 h-4 text-success" />;
      case 'auth_failure': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'biometric_attempt': return <User className="w-4 h-4 text-secondary" />;
      case 'rate_limit_exceeded': return <Lock className="w-4 h-4 text-warning" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getEventSeverity = (type: string) => {
    switch (type) {
      case 'auth_success': return 'success';
      case 'auth_failure': return 'destructive';
      case 'rate_limit_exceeded': return 'destructive';
      case 'biometric_attempt': return 'secondary';
      default: return 'secondary';
    }
  };

  const failureRate = securityMonitor.getFailureRate();
  const suspiciousActivity = securityMonitor.detectSuspiciousActivity();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suspiciousActivity ? (
                <span className="text-destructive">Alert</span>
              ) : (
                <span className="text-success">Secure</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Current threat level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(failureRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last 5 minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Recent security events
            </p>
          </CardContent>
        </Card>
      </div>

      {suspiciousActivity && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Suspicious activity detected! High failure rate or excessive rate limiting events.
            Please review security logs and consider additional protective measures.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Security Events</CardTitle>
            <CardDescription>
              Real-time monitoring of authentication and security events
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRefreshKey(prev => prev + 1)}
          >
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No security events recorded yet
              </p>
            ) : (
              recentEvents.map((event, index) => (
                <div key={index} className="flex items-start justify-between p-3 rounded-lg border">
                  <div className="flex items-start gap-3">
                    {getEventIcon(event.type)}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {event.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                        <Badge variant={getEventSeverity(event.type) as any} className="text-xs">
                          {event.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                      {event.metadata && (
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              <strong>{key}:</strong> {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {event.userId && (
                    <Badge variant="outline" className="text-xs">
                      User: {event.userId.substring(0, 8)}...
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};