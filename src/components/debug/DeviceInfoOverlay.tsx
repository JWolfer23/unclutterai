import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Monitor, Smartphone, Wifi, Clock, Globe, ChevronDown } from "lucide-react";

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  screen: {
    width: number;
    height: number;
    pixelRatio: number;
  };
  timezone: string;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  webAuthn: boolean;
}

const DeviceInfoOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  const collectDeviceInfo = async (): Promise<DeviceInfo> => {
    // Check WebAuthn support
    const webAuthnSupported = !!(
      navigator.credentials && 
      navigator.credentials.create && 
      navigator.credentials.get &&
      window.PublicKeyCredential
    );

    // Check storage availability
    const checkStorage = (storage: Storage): boolean => {
      try {
        const testKey = '__test__';
        storage.setItem(testKey, 'test');
        storage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    };

    // Check IndexedDB
    const checkIndexedDB = (): boolean => {
      try {
        return !!window.indexedDB;
      } catch {
        return false;
      }
    };

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt,
      } : undefined,
      screen: {
        width: screen.width,
        height: screen.height,
        pixelRatio: window.devicePixelRatio,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      localStorage: checkStorage(localStorage),
      sessionStorage: checkStorage(sessionStorage),
      indexedDB: checkIndexedDB(),
      webAuthn: webAuthnSupported,
    };
  };

  const handleToggle = async () => {
    if (!isOpen && !deviceInfo) {
      const info = await collectDeviceInfo();
      setDeviceInfo(info);
    }
    setIsOpen(!isOpen);
  };

  const getDeviceType = (userAgent: string): string => {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'Mobile';
    }
    if (/Tablet|iPad/.test(userAgent)) {
      return 'Tablet';
    }
    return 'Desktop';
  };

  const getBrowser = (userAgent: string): string => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const copyToClipboard = () => {
    if (deviceInfo) {
      const debugInfo = JSON.stringify(deviceInfo, null, 2);
      navigator.clipboard.writeText(debugInfo);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggle}
            className="bg-white/90 backdrop-blur-sm border-purple-200 hover:bg-purple-50"
          >
            <Monitor className="w-4 h-4 mr-2" />
            Debug Info
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          {deviceInfo && (
            <Card className="w-80 bg-white/95 backdrop-blur-sm border-purple-200 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {getDeviceType(deviceInfo.userAgent) === 'Mobile' ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Monitor className="w-4 h-4" />
                    )}
                    {getDeviceType(deviceInfo.userAgent)} - {getBrowser(deviceInfo.userAgent)}
                  </div>
                  <Badge variant={deviceInfo.onLine ? "default" : "destructive"} className="ml-auto">
                    <Wifi className="w-3 h-3 mr-1" />
                    {deviceInfo.onLine ? 'Online' : 'Offline'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="font-medium">Screen</div>
                    <div className="text-gray-600">
                      {deviceInfo.screen.width}×{deviceInfo.screen.height}
                      <br />
                      DPR: {deviceInfo.screen.pixelRatio}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Timezone
                    </div>
                    <div className="text-gray-600">{deviceInfo.timezone}</div>
                  </div>
                </div>

                {deviceInfo.connection && (
                  <div className="space-y-1">
                    <div className="font-medium">Network</div>
                    <div className="text-gray-600">
                      {deviceInfo.connection.effectiveType.toUpperCase()} 
                      • {deviceInfo.connection.downlink}Mbps 
                      • {deviceInfo.connection.rtt}ms RTT
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="font-medium">Browser Support</div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={deviceInfo.cookieEnabled ? "default" : "destructive"} className="text-xs">
                      Cookies
                    </Badge>
                    <Badge variant={deviceInfo.localStorage ? "default" : "destructive"} className="text-xs">
                      LocalStorage
                    </Badge>
                    <Badge variant={deviceInfo.sessionStorage ? "default" : "destructive"} className="text-xs">
                      SessionStorage
                    </Badge>
                    <Badge variant={deviceInfo.indexedDB ? "default" : "destructive"} className="text-xs">
                      IndexedDB
                    </Badge>
                    <Badge variant={deviceInfo.webAuthn ? "default" : "destructive"} className="text-xs">
                      WebAuthn
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-medium flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Language
                  </div>
                  <div className="text-gray-600">{deviceInfo.language}</div>
                </div>

                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="w-full text-xs"
                  >
                    Copy Debug Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default DeviceInfoOverlay;