import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog = ({ message, onConfirm, onCancel }: ConfirmationDialogProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900/95 border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Confirm Action</h3>
        </div>

        <p className="text-white/70">{message}</p>

        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};
