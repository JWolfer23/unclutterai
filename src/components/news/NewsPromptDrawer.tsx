import { useState, useEffect } from "react";
import { Edit3, Save, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NewsPromptDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_PROMPT = `Provide a balanced and insightful summary of the most important global events from the past week.
Include:
• U.S. and global stock markets, inflation data, and major economic reports
• Crypto market trends and major blockchain news
• Key geopolitical updates (Gaza-Israel, Ukraine-Russia, China-Taiwan, etc.)
• Notable scientific, environmental, and cultural developments
• Major policy or tech shifts shaping the world this week.`;

export const NewsPromptDrawer = ({ open, onOpenChange }: NewsPromptDrawerProps) => {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPrompts();
    }
  }, [open]);

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('news_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading prompts",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const savePrompt = async () => {
    if (!newPrompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt text",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (editingId) {
        const { error } = await supabase
          .from('news_prompts')
          .update({ prompt_text: newPrompt })
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: "Prompt updated successfully" });
      } else {
        const { error } = await supabase
          .from('news_prompts')
          .insert({
            user_id: user!.id,
            prompt_text: newPrompt,
            is_active: true,
          });

        if (error) throw error;
        toast({ title: "Prompt saved successfully" });
      }

      setNewPrompt("");
      setEditingId(null);
      loadPrompts();
    } catch (error: any) {
      toast({
        title: "Error saving prompt",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('news_prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Prompt deleted" });
      loadPrompts();
    } catch (error: any) {
      toast({
        title: "Error deleting prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const useDefaultPrompt = () => {
    setNewPrompt(DEFAULT_PROMPT);
    setEditingId(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-black/95 backdrop-blur-2xl border-l border-white/10 text-white"
      >
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold text-slate-50">
            Custom News Prompt
          </SheetTitle>
          <SheetDescription className="text-sm text-slate-300">
            Create and manage your personalized news summary prompts
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* New/Edit Prompt Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-200">
                {editingId ? "Edit Prompt" : "Create New Prompt"}
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={useDefaultPrompt}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Use Default Template
              </Button>
            </div>
            
            <Textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Enter your custom news prompt..."
              className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
            
            <div className="flex gap-2">
              <Button
                onClick={savePrompt}
                disabled={loading}
                className="flex-1 btn-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingId ? "Update" : "Save"} Prompt
              </Button>
              {editingId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewPrompt("");
                    setEditingId(null);
                  }}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Saved Prompts */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-200">
              Saved Prompts ({prompts.length})
            </h3>
            
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400/40 transition-colors"
                  >
                    <p className="text-sm text-slate-300 line-clamp-3 mb-3">
                      {prompt.prompt_text}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setNewPrompt(prompt.prompt_text);
                          setEditingId(prompt.id);
                        }}
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePrompt(prompt.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
