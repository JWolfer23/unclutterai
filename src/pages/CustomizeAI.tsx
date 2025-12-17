import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, SlidersHorizontal, Sparkles, Bell, Calendar, MessageSquare, Shield, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAssistantProfile } from "@/hooks/useAssistantProfile";
import { useAssistantPromotion } from "@/hooks/useAssistantPromotion";
import { AssistantPromotionFlow } from "@/components/promotion/AssistantPromotionFlow";

const CustomizeAI = () => {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useAssistantProfile();
  const { 
    isEligible, 
    assistantMode, 
    acceptPromotion, 
    declinePromotion,
    isLoading: promotionLoading 
  } = useAssistantPromotion();
  
  const [showPromotion, setShowPromotion] = useState(false);
  const [settings, setSettings] = useState({
    smartNotifications: true,
    autoSummarize: true,
    focusMode: false,
    calendarSync: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePromotionComplete = () => {
    setShowPromotion(false);
  };

  const customizationOptions = [
    { 
      icon: Bell, 
      label: "Smart Notifications", 
      description: "AI-powered notification prioritization",
      key: "smartNotifications" as const
    },
    { 
      icon: MessageSquare, 
      label: "Auto-Summarize", 
      description: "Automatic message summaries",
      key: "autoSummarize" as const
    },
    { 
      icon: Sparkles, 
      label: "Focus Mode Integration", 
      description: "Enhanced AI during deep work",
      key: "focusMode" as const
    },
    { 
      icon: Calendar, 
      label: "Calendar Sync", 
      description: "Connect calendar for smart scheduling",
      key: "calendarSync" as const
    },
  ];

  const isOperator = profile?.role === 'operator';

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Promotion Flow Modal */}
      {showPromotion && (
        <AssistantPromotionFlow
          onAccept={acceptPromotion}
          onDecline={declinePromotion}
          onComplete={handlePromotionComplete}
        />
      )}

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
          <div className="metric-icon" style={{ background: "linear-gradient(135deg, hsl(217, 91%, 60%), hsl(266, 83%, 65%))" }}>
            <SlidersHorizontal className="metric-icon__glyph" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customize AI</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Personalize tone, pace, and AI assistant behavior
            </p>
          </div>
        </div>
      </div>

      {/* Assistant Role Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <Card className="glass-card mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                {isOperator ? (
                  <UserCheck className="h-6 w-6 text-white" />
                ) : (
                  <Shield className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <Label className="text-base font-semibold">
                  Assistant Role
                </Label>
                <p className="text-sm text-muted-foreground">
                  Current: {isOperator ? 'Operator' : 'Analyst'} 
                  {isOperator && ' — Auto-handling enabled'}
                </p>
              </div>
            </div>
            {!isOperator && !profileLoading && (
              <Button 
                onClick={() => setShowPromotion(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
              >
                Promote to Operator
              </Button>
            )}
            {isOperator && (
              <span className="text-sm text-emerald-400 font-medium px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Active
              </span>
            )}
          </div>
          
          {isOperator && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-white/60 mb-2">Operator capabilities:</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70">AI-drafted replies auto-applied</span>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70">Auto-scheduling</span>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70">Auto-archiving</span>
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70">Reduced confirmations</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Settings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="space-y-4">
          {customizationOptions.map((option, idx) => {
            const Icon = option.icon;
            return (
              <Card key={idx} className="glass-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Label htmlFor={option.key} className="text-base font-semibold cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <Switch
                    id={option.key}
                    checked={settings[option.key]}
                    onCheckedChange={() => toggleSetting(option.key)}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {/* AI Chatbot Section */}
        <div className="mt-8">
          <h2 className="section-title mb-4">AI Assistant</h2>
          <div className="glass-card">
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Customize your personal AI chatbot with tone preferences, response frequency, and integration settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizeAI;