import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Shield, 
  Download, 
  Trash2, 
  EyeOff, 
  AlertTriangle,
  Lock,
  FileJson,
  Loader2,
  Info
} from 'lucide-react';
import { useGDPRCompliance } from '@/hooks/useGDPRCompliance';

export function PrivacySettings() {
  const { exportData, isExporting, deleteAccount, isDeleting, anonymizeData, isAnonymizing } = useGDPRCompliance();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showAnonymizeDialog, setShowAnonymizeDialog] = useState(false);

  const handleDelete = () => {
    if (deleteConfirmation === 'DELETE') {
      deleteAccount();
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-purple-400" />
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Privacy & Data</h2>
          <p className="text-sm text-slate-400">Manage your data and privacy settings</p>
        </div>
      </div>

      {/* Data Protection Notice */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex gap-3">
          <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm text-blue-200 font-medium">Your data is protected</p>
            <ul className="text-xs text-blue-300/80 space-y-1">
              <li>• All data encrypted at rest using AES-256</li>
              <li>• Row-level security ensures user isolation</li>
              <li>• OAuth tokens encrypted before storage</li>
              <li>• No data shared with third parties</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Export Data */}
      <Card className="p-4 bg-slate-900/60 border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-slate-100">Export Your Data</h3>
              <p className="text-sm text-slate-400 mt-1">
                Download a complete copy of all your data in JSON format. 
                Includes profile, messages, focus sessions, tokens, and preferences.
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => exportData()}
            disabled={isExporting}
            className="shrink-0"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileJson className="w-4 h-4 mr-2" />
            )}
            Export
          </Button>
        </div>
      </Card>

      {/* Anonymize Data */}
      <Card className="p-4 bg-slate-900/60 border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-slate-100">Anonymize Data</h3>
              <p className="text-sm text-slate-400 mt-1">
                Remove personal information from your historical data while keeping 
                your account active. Focus stats and tokens are preserved.
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowAnonymizeDialog(true)}
            disabled={isAnonymizing}
            className="shrink-0 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
          >
            {isAnonymizing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <EyeOff className="w-4 h-4 mr-2" />
            )}
            Anonymize
          </Button>
        </div>
      </Card>

      {/* Delete Account */}
      <Card className="p-4 bg-rose-500/5 border-rose-500/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-medium text-rose-200">Delete Account</h3>
              <p className="text-sm text-rose-300/70 mt-1">
                Permanently delete your account and all associated data. 
                This action cannot be undone. Any on-chain tokens will remain in your wallet.
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
            className="shrink-0 border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      </Card>

      {/* Token Clarification */}
      <Card className="p-4 bg-slate-900/60 border-white/10">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-3">
            <h3 className="font-medium text-slate-100">Understanding Your Tokens</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/20">
                  Off-Chain Credits
                </Badge>
                <span className="text-xs text-slate-400">Available & Pending UCT</span>
              </div>
              <p className="text-xs text-slate-400">
                Credits earned through focus sessions and actions. Stored in our database. 
                Can be used for agent marketplace and premium features.
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20">
                  On-Chain Assets
                </Badge>
                <span className="text-xs text-slate-400">Settled UCT Tokens</span>
              </div>
              <p className="text-xs text-slate-400">
                Tokens minted to your wallet on Base Sepolia (testnet). These are real 
                blockchain assets you control. Account deletion does not affect on-chain tokens.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Anonymize Confirmation Dialog */}
      <Dialog open={showAnonymizeDialog} onOpenChange={setShowAnonymizeDialog}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-amber-400" />
              Anonymize Your Data?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This will remove personal information (name, email, message content) 
              from your historical data. Your account, focus stats, and tokens will 
              be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAnonymizeDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => { anonymizeData(); setShowAnonymizeDialog(false); }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Anonymize Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Your Account?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              This will permanently delete your account and all data. This action 
              cannot be undone. Type <strong className="text-rose-300">DELETE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Type DELETE to confirm"
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            className="bg-slate-800/50 border-white/10"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              disabled={deleteConfirmation !== 'DELETE' || isDeleting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
