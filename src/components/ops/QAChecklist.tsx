import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ClipboardCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Shield,
  Key,
  Mail,
  Wallet,
  Database,
  Sparkles,
  Loader2,
  Play
} from 'lucide-react';

interface QACheckItem {
  id: string;
  category: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
}

const initialChecks: QACheckItem[] = [
  // OAuth flows
  { id: 'oauth-google', category: 'OAuth', name: 'Google OAuth Flow', description: 'Test Gmail connection and token refresh', icon: <Mail className="w-4 h-4" />, status: 'pending' },
  { id: 'oauth-microsoft', category: 'OAuth', name: 'Microsoft OAuth Flow', description: 'Test Outlook connection (when available)', icon: <Mail className="w-4 h-4" />, status: 'pending' },
  { id: 'oauth-meta', category: 'OAuth', name: 'Meta OAuth Flow', description: 'Test Facebook/Instagram connection (when available)', icon: <Mail className="w-4 h-4" />, status: 'pending' },
  
  // RLS tests
  { id: 'rls-isolation', category: 'Security', name: 'RLS User Isolation', description: 'Verify users cannot access other users data', icon: <Shield className="w-4 h-4" />, status: 'pending' },
  { id: 'rls-policies', category: 'Security', name: 'RLS Policy Coverage', description: 'All tables have appropriate RLS policies', icon: <Shield className="w-4 h-4" />, status: 'pending' },
  { id: 'auth-endpoints', category: 'Security', name: 'Auth Endpoint Security', description: 'Edge functions validate JWT properly', icon: <Key className="w-4 h-4" />, status: 'pending' },
  { id: 'rate-limiting', category: 'Security', name: 'Rate Limiting', description: 'Verify rate limits on sensitive endpoints', icon: <Shield className="w-4 h-4" />, status: 'pending' },
  { id: 'hmac-validation', category: 'Security', name: 'HMAC Webhook Validation', description: 'Ingest endpoint validates webhook signatures', icon: <Key className="w-4 h-4" />, status: 'pending' },
  
  // AI edge cases
  { id: 'ai-long-emails', category: 'AI', name: 'Long Email Handling', description: 'AI summarizer handles 10k+ character emails', icon: <Sparkles className="w-4 h-4" />, status: 'pending' },
  { id: 'ai-attachments', category: 'AI', name: 'Attachment Processing', description: 'AI handles emails with attachments gracefully', icon: <Sparkles className="w-4 h-4" />, status: 'pending' },
  { id: 'ai-special-chars', category: 'AI', name: 'Special Characters', description: 'AI handles unicode, emojis, and special formatting', icon: <Sparkles className="w-4 h-4" />, status: 'pending' },
  { id: 'ai-rate-limits', category: 'AI', name: 'AI Rate Limit Handling', description: 'Graceful degradation when AI limits hit', icon: <Sparkles className="w-4 h-4" />, status: 'pending' },
  
  // Token accounting
  { id: 'token-earning', category: 'Tokens', name: 'UCT Earning Flow', description: 'Tokens correctly credited for actions', icon: <Wallet className="w-4 h-4" />, status: 'pending' },
  { id: 'token-spending', category: 'Tokens', name: 'UCT Spending Flow', description: 'Agent marketplace correctly deducts tokens', icon: <Wallet className="w-4 h-4" />, status: 'pending' },
  { id: 'token-reconciliation', category: 'Tokens', name: 'Token Reconciliation', description: 'Ledger sums match balance (1000 event simulation)', icon: <Database className="w-4 h-4" />, status: 'pending' },
  { id: 'token-negative', category: 'Tokens', name: 'Negative Balance Prevention', description: 'Cannot spend more than available', icon: <Wallet className="w-4 h-4" />, status: 'pending' },
  
  // Wallet & blockchain
  { id: 'wallet-connect', category: 'Blockchain', name: 'Wallet Connect', description: 'Privy wallet connection works', icon: <Wallet className="w-4 h-4" />, status: 'pending' },
  { id: 'wallet-persist', category: 'Blockchain', name: 'Wallet Persistence', description: 'Wallet address saved to profile', icon: <Database className="w-4 h-4" />, status: 'pending' },
  { id: 'testnet-mint', category: 'Blockchain', name: 'Testnet Mint', description: 'Mock mint on Base Sepolia works', icon: <Wallet className="w-4 h-4" />, status: 'pending' },
];

export function QAChecklist() {
  const [checks, setChecks] = useState<QACheckItem[]>(initialChecks);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const updateCheckStatus = (id: string, status: QACheckItem['status']) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const runCheck = async (check: QACheckItem) => {
    updateCheckStatus(check.id, 'running');
    // Simulate check execution
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    // Random result for demo (in real impl, would call actual test functions)
    const passed = Math.random() > 0.2;
    updateCheckStatus(check.id, passed ? 'passed' : 'failed');
  };

  const runAllChecks = async () => {
    setIsRunningAll(true);
    for (const check of checks) {
      await runCheck(check);
    }
    setIsRunningAll(false);
  };

  const toggleManualCheck = (id: string) => {
    const check = checks.find(c => c.id === id);
    if (check?.status === 'pending' || check?.status === 'failed') {
      updateCheckStatus(id, 'passed');
    } else if (check?.status === 'passed') {
      updateCheckStatus(id, 'pending');
    }
  };

  const categories = [...new Set(checks.map(c => c.category))];
  const passedCount = checks.filter(c => c.status === 'passed').length;
  const failedCount = checks.filter(c => c.status === 'failed').length;

  const statusIcons = {
    pending: <Clock className="w-4 h-4 text-slate-400" />,
    running: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
    passed: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    failed: <XCircle className="w-4 h-4 text-rose-400" />,
    skipped: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Beta QA Checklist</h2>
            <p className="text-xs text-slate-400">
              {passedCount}/{checks.length} checks passed
              {failedCount > 0 && ` • ${failedCount} failed`}
            </p>
          </div>
        </div>
        <Button 
          onClick={runAllChecks}
          disabled={isRunningAll}
          className="bg-gradient-to-r from-purple-600 to-blue-600"
        >
          {isRunningAll ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Run All Checks
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
          style={{ width: `${(passedCount / checks.length) * 100}%` }}
        />
      </div>

      {/* Checks by category */}
      {categories.map((category) => (
        <Card key={category} className="p-4 bg-slate-900/60 border-white/10">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">{category}</h3>
          <div className="space-y-2">
            {checks.filter(c => c.category === category).map((check) => (
              <div 
                key={check.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                onClick={() => toggleManualCheck(check.id)}
              >
                <Checkbox 
                  checked={check.status === 'passed'}
                  className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <div className="p-1.5 rounded bg-slate-800/50 text-slate-300">
                  {check.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{check.name}</p>
                  <p className="text-xs text-slate-400 truncate">{check.description}</p>
                </div>
                {statusIcons[check.status]}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
