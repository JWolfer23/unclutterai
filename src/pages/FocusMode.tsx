import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, X, Zap, Clock, Target, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { toast } from "@/hooks/use-toast";
import { FocusStreakStrip, SessionCompletionCard, FocusLevelIndicator } from "@/components/focus";

const FocusMode = () => {
  const navigate = useNavigate();
  const { 
    startSession, 
    completeSession, 
    breakSession, 
    saveSessionNotes,
    addInterruption, 
    activeSession 
  } = useFocusSessions();

  const [taskInput, setTaskInput] = useState("");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [duration, setDuration] = useState(25);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [interruptions, setInterruptions] = useState(0);
  const [sessionNote, setSessionNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  // Track actual minutes spent
  const actualMinutesRef = useRef(0);

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

  // Calculate actual minutes whenever timer changes
  useEffect(() => {
    if (isActive) {
      actualMinutesRef.current = Math.floor((duration * 60 - timeRemaining) / 60);
    }
  }, [timeRemaining, duration, isActive]);

  const handleStart = () => {
    if (!taskInput && !selectedTask) {
      toast({
        title: "Task Required",
        description: "Please select or enter a task to focus on.",
        variant: "destructive",
      });
      return;
    }

    // Start session with mode and goal
    startSession({
      plannedMinutes: duration,
      mode: selectedTask || 'general',
      goal: taskInput || selectedTask,
    });

    setIsActive(true);
    setTimeRemaining(duration * 60);
    setSessionComplete(false);
    setInterruptions(0);
    setNoteSaved(false);
    setCompletedSessionId(null);
    actualMinutesRef.current = 0;
    
    toast({
      title: "🎯 Focus Mode Activated",
      description: "Stay focused to earn UCT tokens!",
    });
  };

  const handleTaskCompleted = async () => {
    const actualMinutes = Math.max(Math.floor((duration * 60 - timeRemaining) / 60), 1);
    
    // Calculate UCT reward: duration_minutes * 0.1
    const uctReward = Math.round(actualMinutes * 0.1 * 100) / 100;
    
    // Complete the session in backend
    if (activeSession) {
      try {
        await completeSession.mutateAsync({
          sessionId: activeSession.id,
          actualMinutes,
          interruptions,
        });
        setCompletedSessionId(activeSession.id);
      } catch (error) {
        console.error("Error completing session:", error);
      }
    }
    
    setTokensEarned(uctReward);
    setSessionComplete(true);
    setIsActive(false);
    setIsPaused(false);

    toast({
      title: "✅ Task Completed!",
      description: `You earned ${uctReward} UCT tokens! Add your notes below.`,
    });
  };

  const handleInterruption = () => {
    setInterruptions((prev) => prev + 1);
    if (activeSession) {
      addInterruption(activeSession.id);
    }
    toast({
      title: "⚠️ Break Logged",
      description: "Try to minimize breaks for maximum tokens!",
      variant: "destructive",
    });
  };

  const handleBreak = () => {
    const actualMinutes = Math.max(Math.floor((duration * 60 - timeRemaining) / 60), 0);
    
    // Break session - no reward
    if (activeSession) {
      breakSession({
        sessionId: activeSession.id,
        actualMinutes,
        interruptions,
      });
    }
    
    setIsActive(false);
    setIsPaused(false);
    
    setTimeout(() => navigate("/"), 1500);
  };

  const handleSessionComplete = async () => {
    // Timer reached zero - complete session
    const uctReward = Math.round(duration * 0.1 * 100) / 100;
    
    setTokensEarned(uctReward);
    setSessionComplete(true);
    setIsActive(false);

    if (activeSession) {
      try {
        await completeSession.mutateAsync({
          sessionId: activeSession.id,
          actualMinutes: duration,
          interruptions,
        });
        setCompletedSessionId(activeSession.id);
      } catch (error) {
        console.error("Error completing session:", error);
      }
    }

    toast({
      title: "🎉 Focus Session Complete!",
      description: `You earned ${uctReward} UCT tokens!`,
    });
  };

  const handleSaveNote = async () => {
    if (!sessionNote.trim()) {
      toast({
        title: "Note Required",
        description: "Please write something before saving.",
        variant: "destructive",
      });
      return;
    }

    const sessionId = completedSessionId || activeSession?.id;
    
    if (sessionId) {
      // Save notes to the focus session
      saveSessionNotes({
        sessionId,
        notes: sessionNote,
      });
      
      setNoteSaved(true);
      const modeNames: Record<string, string> = {
        learning: "Learning Mode",
        health: "Health Mode",
        career: "Career Mode",
        wealth: "Wealth Mode",
        general: "Focus Mode",
      };

      toast({
        title: "✅ Note Saved",
        description: `Note saved to ${modeNames[selectedTask] || 'Focus Mode'}`,
      });
    } else {
      toast({
        title: "Error",
        description: "No session to save notes to.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((duration * 60 - timeRemaining) / (duration * 60)) * 100;
  const actualMinutesDisplay = Math.floor((duration * 60 - timeRemaining) / 60);

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

      {/* Session Complete Card - Enhanced */}
      {sessionComplete && (
        <SessionCompletionCard
          tokensEarned={tokensEarned}
          actualMinutes={actualMinutesDisplay || duration}
          sessionNote={sessionNote}
          onNoteChange={setSessionNote}
          onSaveNote={handleSaveNote}
          noteSaved={noteSaved}
          selectedTask={selectedTask}
        />
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
              Select a task or type below
            </label>
            
            <Select value={selectedTask} onValueChange={setSelectedTask} disabled={isActive}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select a task or type below" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="learning" className="text-white">
                  Learning Mode
                </SelectItem>
                <SelectItem value="health" className="text-white">
                  Health Mode
                </SelectItem>
                <SelectItem value="career" className="text-white">
                  Career Mode
                </SelectItem>
                <SelectItem value="wealth" className="text-white">
                  Wealth Mode
                </SelectItem>
              </SelectContent>
            </Select>
            
            <label className="block text-sm font-semibold mt-6 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              Input your goal for the focus session
            </label>
            
            <Input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="e.g., Finish writing portfolio summary, complete course lesson, stretch, review investments"
              disabled={isActive}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Duration Selector */}
          {!isActive && (
            <div className="mb-6">
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
              
              {/* Streak Strip - Pre-session */}
              <FocusStreakStrip 
                isActive={false} 
                duration={duration} 
                timeRemaining={duration * 60} 
              />
              
              {/* Level Indicator */}
              <div className="mt-4">
                <FocusLevelIndicator />
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
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-purple-400">{duration}m</div>
                  <div className="text-xs text-slate-400">Planned</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-red-400">{interruptions}</div>
                  <div className="text-xs text-slate-400">Breaks</div>
                </div>
              </div>

              {/* Streak & Reward Strip */}
              <FocusStreakStrip 
                isActive={isActive} 
                duration={duration} 
                timeRemaining={timeRemaining} 
              />
              
              {/* Level Indicator */}
              <div className="mt-4">
                <FocusLevelIndicator />
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
                <Button onClick={handleTaskCompleted} className="flex-1 h-12 bg-black hover:bg-slate-900 text-white border border-white/20">
                  <Check className="w-5 h-5 mr-2" />
                  Task Completed
                </Button>
                <Button onClick={handleInterruption} variant="outline" className="h-12">
                  Break
                </Button>
                <Button onClick={handleBreak} variant="destructive" className="h-12">
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
