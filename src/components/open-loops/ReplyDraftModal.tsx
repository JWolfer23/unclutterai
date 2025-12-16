import { X, Send, Edit3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface ReplyDraftModalProps {
  draft: string;
  onSend: () => void;
  onEdit: (newDraft: string) => void;
  onClose: () => void;
  isSending?: boolean;
}

const ReplyDraftModal = ({ draft, onSend, onEdit, onClose, isSending }: ReplyDraftModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState(draft);

  const handleSave = () => {
    onEdit(editedDraft);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">AI Draft Reply</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {isEditing ? (
            <Textarea
              value={editedDraft}
              onChange={(e) => setEditedDraft(e.target.value)}
              className="min-h-[200px] bg-white/5 border-white/10 text-white resize-none"
              placeholder="Edit your reply..."
            />
          ) : (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                {draft}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-4 border-t border-white/10">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="flex-1 text-white/70"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="flex-1 text-white/70 gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
              <Button
                onClick={onSend}
                disabled={isSending}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white gap-2"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Reply
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReplyDraftModal;
