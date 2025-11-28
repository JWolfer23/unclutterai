import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLearning } from "@/hooks/useLearning";
import { Target, Plus, Check, Trash2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const GoalsSection = () => {
  const { goals, addGoal, updateGoal, deleteGoal, isAddingGoal } = useLearning();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState<string>("daily");
  const [targetValue, setTargetValue] = useState("1");
  const [suggestion, setSuggestion] = useState<string>("");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const handleSubmit = () => {
    if (!title) return;

    addGoal({
      title,
      description: description || null,
      goal_type: goalType,
      target_value: parseInt(targetValue) || 1,
      current_value: 0,
    });

    setTitle("");
    setDescription("");
    setTargetValue("1");
    setShowForm(false);
  };

  const handleComplete = (goal: any) => {
    updateGoal({
      id: goal.id,
      updates: { is_completed: true, current_value: goal.target_value },
    });
  };

  const handleProgress = (goal: any, increment: number) => {
    const newValue = Math.min(goal.current_value + increment, goal.target_value);
    updateGoal({
      id: goal.id,
      updates: { current_value: newValue },
    });
  };

  const getSuggestion = async () => {
    if (!goals || goals.length === 0) {
      toast({ title: "Add some goals first to get AI suggestions" });
      return;
    }

    setLoadingSuggestion(true);
    try {
      const { data, error } = await supabase.functions.invoke("learning-assistant", {
        body: { goals },
      });

      if (error) throw error;
      setSuggestion(data.suggestion);
    } catch (error: any) {
      toast({
        title: "Failed to get suggestion",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const completedGoals = goals?.filter((g) => g.is_completed) || [];
  const activeGoals = goals?.filter((g) => !g.is_completed) || [];

  return (
    <div className="space-y-4">
      {/* AI Suggestion Card */}
      {suggestion && (
        <Card className="glass-card--primary p-4 border border-purple-400/35">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-purple-300" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-purple-200 mb-1">Suggested Next Step</h4>
              <p className="text-sm text-slate-300">{suggestion}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Get Suggestion Button */}
      {goals && goals.length > 0 && !suggestion && (
        <Button
          onClick={getSuggestion}
          disabled={loadingSuggestion}
          variant="outline"
          className="w-full border-purple-400/35 text-purple-200 hover:bg-purple-500/10"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {loadingSuggestion ? "Getting suggestion..." : "Get AI Suggested Next Step"}
        </Button>
      )}

      {/* Add Goal Button */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="btn-primary w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add New Goal
        </Button>
      )}

      {/* Add Goal Form */}
      {showForm && (
        <Card className="glass-card--primary p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Goal Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete React course"
              className="bg-slate-900/50 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details about your goal..."
              className="bg-slate-900/50 border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Goal Type</Label>
              <Select value={goalType} onValueChange={setGoalType}>
                <SelectTrigger className="bg-slate-900/50 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Target Value</Label>
              <Input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                min="1"
                className="bg-slate-900/50 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!title || isAddingGoal} className="btn-primary flex-1">
              Create Goal
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="border-white/10">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">Active Goals</h3>
          {activeGoals.map((goal) => {
            const progressPercent = (goal.current_value / goal.target_value) * 100;
            return (
              <Card key={goal.id} className="glass-card--primary p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-purple-300" />
                      <h4 className="text-sm font-medium text-slate-50">{goal.title}</h4>
                    </div>
                    {goal.description && (
                      <p className="text-xs text-slate-400 mb-2">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/40 capitalize">
                        {goal.goal_type}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteGoal(goal.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-slate-200">
                      {goal.current_value} / {goal.target_value}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleProgress(goal, 1)}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/10 text-slate-200"
                    disabled={goal.current_value >= goal.target_value}
                  >
                    +1 Progress
                  </Button>
                  {goal.current_value >= goal.target_value && (
                    <Button onClick={() => handleComplete(goal)} size="sm" className="btn-primary">
                      <Check className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">Completed</h3>
          {completedGoals.map((goal) => (
            <Card key={goal.id} className="glass-card--primary p-3 opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">{goal.title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteGoal(goal.id)}
                  className="text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};