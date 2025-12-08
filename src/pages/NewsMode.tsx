import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Newspaper, Edit3, Calendar, Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewsPromptDrawer } from "@/components/news/NewsPromptDrawer";
import { ScheduleDrawer } from "@/components/news/ScheduleDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const NewsMode = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [promptDrawerOpen, setPromptDrawerOpen] = useState(false);
  const [scheduleDrawerOpen, setScheduleDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { toast } = useToast();

  const categories = [
    { id: "yourNews", label: "Your News", icon: Sparkles },
    { id: "prompt", label: "News Prompt", icon: Edit3 },
    { id: "schedule", label: "Schedule", icon: Calendar },
  ];

  useEffect(() => {
    checkAuth();
    loadActivePrompt();
    loadLatestSummary();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use News Mode",
        variant: "destructive",
      });
    }
  };

  const loadActivePrompt = async () => {
    try {
      const { data } = await supabase
        .from('news_prompts')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setActivePromptId(data.id);
      }
    } catch (error: any) {
      console.error('Error loading active prompt:', error);
    }
  };

  const loadLatestSummary = async () => {
    try {
      const { data } = await supabase
        .from('news_summaries')
        .select('summary_text')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setSummary(data.summary_text);
      }
    } catch (error: any) {
      console.error('Error loading summary:', error);
    }
  };

  const handleCategoryClick = async (id: string) => {
    if (id === "prompt") {
      if (!isAuthenticated) {
        navigate('/auth');
        return;
      }
      setPromptDrawerOpen(true);
      return;
    }
    
    if (id === "schedule") {
      if (!isAuthenticated) {
        navigate('/auth');
        return;
      }
      setScheduleDrawerOpen(true);
      return;
    }

    if (id === "yourNews") {
      if (!isAuthenticated) {
        navigate('/auth');
        return;
      }
      setSelectedCategory(id);
      await generateSummary(activePromptId);
    }
  };

  const generateSummary = async (promptId: string | null = null) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Session expired",
          description: "Please sign in again",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }
      
      const response = await supabase.functions.invoke('generate-news-summary', {
        body: { promptId: promptId || activePromptId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate summary');
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setSummary(response.data.summary);
      setSelectedCategory("yourNews");
      toast({
        title: "News summary generated",
        description: "Your personalized news digest is ready",
      });
    } catch (error: any) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error generating summary",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromDrawer = async (promptId: string | null, _promptText: string) => {
    await generateSummary(promptId);
  };

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="metric-icon metric-icon--focus">
            <Newspaper className="metric-icon__glyph" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">News Mode</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Curated, signal-over-noise content streams
            </p>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all
                  ${selectedCategory === cat.id
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:from-purple-600 hover:to-blue-600"
                    : "bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* News Feed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="glass-card">
            <div className="text-center py-12">
              <Loader2 className="h-16 w-16 mx-auto mb-4 text-purple-400 animate-spin" />
              <h3 className="text-xl font-semibold mb-2 text-slate-50">
                Generating Your News Summary...
              </h3>
              <p className="text-slate-400 max-w-md mx-auto">
                AI is curating the most important updates for you
              </p>
            </div>
          </div>
        ) : summary ? (
          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-50">Your Personalized News Digest</h3>
                <p className="text-sm text-slate-400">Generated just for you</p>
              </div>
            </div>
            
            <div className="prose prose-invert prose-purple max-w-none text-slate-300 leading-relaxed">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-50 mt-6 mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-semibold text-slate-100 mt-5 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-medium text-slate-200 mt-4 mb-2">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-2 my-4">{children}</ul>,
                  li: ({ children }) => <li className="text-slate-300">{children}</li>,
                  p: ({ children }) => <p className="text-slate-300 my-3">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
                }}
              >
                {summary}
              </ReactMarkdown>
            </div>

            <Button
              onClick={() => generateSummary(activePromptId)}
              className="mt-6 btn-primary"
              disabled={loading}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Regenerate Summary
            </Button>
          </Card>
        ) : (
          <div className="glass-card">
            <div className="text-center py-12">
              <Newspaper className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold mb-2 text-slate-50">Ready to Get Your News</h3>
              <p className="text-slate-400 max-w-md mx-auto mb-6">
                Click "Your News" to generate an AI-powered summary of what matters most to you.
                No clickbait, just signal.
              </p>
              <Button
                onClick={() => handleCategoryClick("yourNews")}
                className="btn-primary"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Your News
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drawers */}
      <NewsPromptDrawer
        open={promptDrawerOpen}
        onOpenChange={setPromptDrawerOpen}
        onGenerateNews={handleGenerateFromDrawer}
      />
      <ScheduleDrawer
        open={scheduleDrawerOpen}
        onOpenChange={setScheduleDrawerOpen}
      />
    </div>
  );
};

export default NewsMode;
