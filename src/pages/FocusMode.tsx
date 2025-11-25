import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, X, Zap, Coins, Award, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "@/hooks/use-toast";

const FocusMode = () => {
  const navigate = useNavigate();
  const { startSession, endSession, addInterruption, activeSession } = useFocusSessions();
  const { tasks } = useTasks();

  const [taskInput, setTaskInput] = useState("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [duration, setDuration] = useState(25);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [interruptions, setInterruptions] = useState(0);

  // Timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => {
          if (time <= 1) {
            handleSessionComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, timeRemaining]);

  const handleStart = () => {
    if (!taskInput && !selectedTask) {
      toast({
        title: "Task Required",
        description: "Please select or enter a task to focus on.",
        variant: "destructive",
      });
      return;
    }

    startSession(duration);
    setIsActive(true);
    setTimeRemaining(duration * 60);
    setSessionComplete(false);
    setInterruptions(0);
    
    toast({
      title: "🎯 Focus Mode Activated",
      description: "Stay focused to earn UCT tokens!",
    });
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    toast({
      title: isPaused ? "▶️ Resumed" : "⏸️ Paused",
      description: isPaused ? "Keep going!" : "Take a quick break if needed.",
    });
  };

  const handleInterruption = () => {
    setInterruptions((prev) => prev + 1);
    if (activeSession) {
      addInterruption(activeSession.id);
    }
    toast({
      title: "⚠️ Interruption Logged",
      description: "Try to minimize breaks for maximum tokens!",
      variant: "destructive",
    });
  };

  const handleEnd = () => {
    if (activeSession) {
      const actualMinutes = Math.floor((duration * 60 - timeRemaining) / 60);
      endSession({
        sessionId: activeSession.id,
        actualMinutes,
        interruptions,
      });
    }
    
    setIsActive(false);
    setIsPaused(false);
    toast({
      title: "Session Ended",
      description: "Focus session saved.",
    });
    
    setTimeout(() => navigate("/"), 1500);
  };

  const handleSessionComplete = () => {
    const baseTokens = duration * 0.08; // ~2 tokens per 25min
    const interruptionPenalty = interruptions * 0.5;
    const earned = Math.max(Math.round(baseTokens - interruptionPenalty), 1);
    
    setTokensEarned(earned);
    setSessionComplete(true);
    setIsActive(false);

    if (activeSession) {
      endSession({
        sessionId: activeSession.id,
        actualMinutes: duration,
        interruptions,
      });
    }

    toast({
      title: "🎉 Focus Session Complete!",
      description: `You earned ${earned} UCT tokens!`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((duration * 60 - timeRemaining) / (duration * 60)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              Focus Mode
            </h1>
          </div>
          <p className="text-slate-400 text-sm">Deep work. Zero distractions. Maximum rewards.</p>
        </div>
      </div>

      {/* Session Complete Card */}
      {sessionComplete && (
        <div className="max-w-2xl mx-auto mb-8 glass-card glass-card--primary">
          <div className="text-center">
            <Award className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Session Complete! 🎉</h2>
            <p className="text-slate-300 mb-4">You stayed focused for {duration} minutes</p>
            
            <div className="flex items-center justify-center gap-2 mb-6">
              <Coins className="w-6 h-6 text-yellow-400" />
              <span className="text-3xl font-bold text-yellow-400">+{tokensEarned}</span>
              <span className="text-slate-400">UCT Tokens</span>
            </div>

            <Button onClick={() => navigate("/")} className="btn-primary">
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Main Focus Card */}
      {!sessionComplete && (
        <div className="max-w-2xl mx-auto glass-card">
          {/* Do Not Disturb Badge */}
          {isActive && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-xs font-semibold text-red-400">
              🔴 Do Not Disturb
            </div>
          )}

          {/* Task Selector */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              What will you focus on?
            </label>
            
            {tasks && tasks.length > 0 ? (
              <Select value={selectedTask} onValueChange={setSelectedTask} disabled={isActive}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a task or type below..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id} className="text-white">
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            
            <Input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Or type a new task..."
              disabled={isActive}
              className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Duration Selector */}
          {!isActive && (
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Session Duration
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[15, 25, 45, 60].map((min) => (
                  <button
                    key={min}
                    onClick={() => setDuration(min)}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      duration === min
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {min}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Timer Display */}
          {isActive && (
            <div className="mb-8">
              <div className="relative w-64 h-64 mx-auto mb-6">
                {/* Progress Ring */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Time Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-6xl font-bold">{formatTime(timeRemaining)}</div>
                  <div className="text-sm text-slate-400 mt-2">Time Remaining</div>
                </div>
              </div>

              {/* Session Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-purple-400">{duration}m</div>
                  <div className="text-xs text-slate-400">Planned</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-red-400">{interruptions}</div>
                  <div className="text-xs text-slate-400">Interruptions</div>
                </div>
              </div>

              {/* Summary Indicator */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-sm text-blue-300">Summarizing communications in the background...</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isActive ? (
              <Button onClick={handleStart} className="flex-1 btn-primary h-12">
                <Play className="w-5 h-5 mr-2" />
                Start Focus Session
              </Button>
            ) : (
              <>
                <Button onClick={handlePause} variant="outline" className="flex-1 h-12">
                  {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button onClick={handleInterruption} variant="outline" className="h-12">
                  Break
                </Button>
                <Button onClick={handleEnd} variant="destructive" className="h-12">
                  <X className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusMode;
