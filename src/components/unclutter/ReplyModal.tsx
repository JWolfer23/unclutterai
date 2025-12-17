import { useState } from "react";
import { X, Send, Edit3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReplyModalProps {
  draft: string;
  onSend: (finalDraft: string) => void;
  onClose: () => void;
  isSending?: boolean;
  requiresConfirmation: boolean;
}

const ReplyModal = ({ 
  draft, 
  onSend, 
  onClose, 
  isSending = false,
  requiresConfirmation 
}: ReplyModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState(draft);

  const handleSend = () => {
    onSend(editedDraft);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-medium text-white">Draft Reply</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isEditing ? (
            <Textarea
              value={editedDraft}
              onChange={(e) => setEditedDraft(e.target.value)}
              className="min-h-[200px] bg-white/5 border-white/10 text-white resize-none"
              placeholder="Write your reply..."
            />
          ) : (
            <div className="min-h-[200px] p-4 rounded-xl bg-white/5 text-white/90 whitespace-pre-wrap">
              {editedDraft}
            </div>
          )}
        </div>

        {/* Confirmation notice */}
        {requiresConfirmation && (
          <div className="px-4 pb-2">
            <p className="text-xs text-amber-400/80">
              This will send an email on your behalf.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-white/10">
          {isEditing ? (
            <>
              <Button
                onClick={() => setIsEditing(false)}
                variant="ghost"
                className="text-white/60 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setIsEditing(true)}
                variant="ghost"
                className="text-white/60 hover:text-white"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReplyModal;
