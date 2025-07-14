import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ExternalLink, Clock, FileText, Brain, Mail } from "lucide-react";

const BlockchainLogs = () => {
  // Mock blockchain logs data
  const blockchainLogs = [
    {
      id: 1,
      type: "AI Summary",
      description: "Daily email summary generated and verified",
      hash: "0xa1b2c3d4e5f6789012345678901234567890abcdef",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      icon: Brain,
      status: "verified"
    },
    {
      id: 2,
      type: "Message Processing",
      description: "Spam detection algorithm executed",
      hash: "0xf6789012345678901234567890abcdefa1b2c3d4e5",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      icon: Mail,
      status: "verified"
    },
    {
      id: 3,
      type: "Focus Session",
      description: "Productivity session logged and rewards calculated",
      hash: "0x34567890abcdefa1b2c3d4e5f6789012345678901",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      icon: Clock,
      status: "verified"
    },
    {
      id: 4,
      type: "Data Vault",
      description: "Anonymized usage data contribution recorded",
      hash: "0xbcdefa1b2c3d4e5f678901234567890123456789",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      icon: FileText,
      status: "pending"
    }
  ];

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const openBlockchainExplorer = (hash: string) => {
    // Mock blockchain explorer - in real implementation, this would open actual explorer
    window.open(`https://explorer.unclutterai.com/tx/${hash}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            Blockchain Verification
          </CardTitle>
          <CardDescription>
            All AI actions and summaries are cryptographically verified and stored on-chain for transparency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-2xl font-bold text-primary">127</div>
              <div className="text-sm text-muted-foreground">Total Verified Actions</div>
            </div>
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-2xl font-bold text-green-600">99.8%</div>
              <div className="text-sm text-muted-foreground">Verification Success Rate</div>
            </div>
            <div className="text-center p-4 bg-accent rounded-lg">
              <div className="text-2xl font-bold text-blue-600">24/7</div>
              <div className="text-sm text-muted-foreground">Continuous Monitoring</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Recent Blockchain Logs</CardTitle>
          <CardDescription>Latest AI actions verified on the blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {blockchainLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <log.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.type}</span>
                      <Badge 
                        variant={log.status === 'verified' ? 'default' : 'secondary'}
                        className={log.status === 'verified' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{log.description}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      Hash: {formatHash(log.hash)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{getRelativeTime(log.timestamp)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openBlockchainExplorer(log.hash)}
                    className="p-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verification Info */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>How Verification Works</CardTitle>
          <CardDescription>Understanding blockchain-backed AI transparency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <div className="font-medium">AI Action Performed</div>
                <div className="text-sm text-muted-foreground">UnclutterAI processes your data or performs an action</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <span className="text-blue-600 font-bold text-sm">2</span>
              </div>
              <div>
                <div className="font-medium">Cryptographic Hash Generated</div>
                <div className="text-sm text-muted-foreground">A unique fingerprint of the action is created</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <span className="text-blue-600 font-bold text-sm">3</span>
              </div>
              <div>
                <div className="font-medium">Blockchain Storage</div>
                <div className="text-sm text-muted-foreground">Hash is permanently stored on the blockchain for verification</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockchainLogs;