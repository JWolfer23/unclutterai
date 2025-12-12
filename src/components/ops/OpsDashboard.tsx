import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Database, 
  Shield, 
  Cpu, 
  Sparkles,
  BarChart3,
  Flag,
  Loader2
} from 'lucide-react';
import { useOpsHealth } from '@/hooks/useOpsHealth';

const statusIcons = {
  healthy: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  degraded: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  down: <XCircle className="w-4 h-4 text-rose-400" />,
};

const statusColors = {
  healthy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  degraded: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  down: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

const serviceIcons: Record<string, React.ReactNode> = {
  database: <Database className="w-4 h-4" />,
  auth: <Shield className="w-4 h-4" />,
  edge_functions: <Cpu className="w-4 h-4" />,
  ai_gateway: <Sparkles className="w-4 h-4" />,
};

export function OpsDashboard() {
  const { health, metrics, isLoading, refetch } = useOpsHealth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-lg font-semibold text-slate-100">System Health</h2>
            <p className="text-xs text-slate-400">
              Last updated: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="border-white/10"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      ) : (
        <>
          {/* Overall Status */}
          <Card className="p-4 bg-slate-900/60 border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {health?.status && statusIcons[health.status]}
                <span className="font-medium text-slate-100">Overall Status</span>
              </div>
              <Badge variant="outline" className={health?.status ? statusColors[health.status] : ''}>
                {health?.status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
            {health?.total_latency_ms && (
              <p className="text-xs text-slate-400 mt-2">
                Health check completed in {health.total_latency_ms}ms
              </p>
            )}
          </Card>

          {/* Service Checks */}
          <div className="grid gap-3 md:grid-cols-2">
            {health?.checks.map((check) => (
              <Card key={check.service} className="p-3 bg-slate-900/40 border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800/50 text-slate-300">
                      {serviceIcons[check.service] || <Cpu className="w-4 h-4" />}
                    </div>
                    <span className="text-sm font-medium text-slate-200 capitalize">
                      {check.service.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{check.latency_ms}ms</span>
                    {statusIcons[check.status]}
                  </div>
                </div>
                {check.details?.error && (
                  <p className="text-xs text-rose-400 mt-2 truncate">
                    {String(check.details.error)}
                  </p>
                )}
              </Card>
            ))}
          </div>

          {/* Metrics Summary */}
          {metrics && (
            <Card className="p-4 bg-slate-900/60 border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span className="font-medium text-slate-100">24h Metrics</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-slate-100">{metrics.total_events}</p>
                  <p className="text-xs text-slate-400">Total Events</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-300">{metrics.success_rate}</p>
                  <p className="text-xs text-slate-400">Success Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-300">{metrics.avg_latency_ms}ms</p>
                  <p className="text-xs text-slate-400">Avg Latency</p>
                </div>
              </div>
            </Card>
          )}

          {/* Feature Flags */}
          <Card className="p-4 bg-slate-900/60 border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Flag className="w-4 h-4 text-purple-400" />
              <span className="font-medium text-slate-100">Feature Flags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {health?.feature_flags.map((flag) => (
                <Badge 
                  key={flag.flag_name} 
                  variant="outline"
                  className={flag.is_enabled 
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }
                >
                  {flag.flag_name.replace('_', ' ')}
                  {flag.rollout_percentage < 100 && flag.is_enabled && (
                    <span className="ml-1 text-[10px] opacity-60">
                      {flag.rollout_percentage}%
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
