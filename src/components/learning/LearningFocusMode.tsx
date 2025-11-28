import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { Brain, Play, Pause, Square } from "lucide-react";

export const LearningFocusMode = () => {
  const { activeSession, startSession, endSession, isStarting, isEnding } = useFocusSessions();
  const [plannedMinutes, setPlannedMinutes] = useState("25");
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const startFocusSession = () => {
    const minutes = parseInt(plannedMinutes) || 25;
    startSession(minutes);
    
    // Start timer
    const id = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    setIntervalId(id);
  };

  const pauseTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsPaused(true);
  };

  const resumeTimer = () => {
    const id = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    setIntervalId(id);
    setIsPaused(false);
  };

  const endFocusSession = () => {
    if (intervalId) clearInterval(intervalId);
    if (activeSession) {
      const actualMinutes = Math.floor(timer / 60);
      endSession({
        sessionId: activeSession.id,
        actualMinutes,
        interruptions: 0,
      });
    }
    setTimer(0);
    setIsPaused(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {!activeSession ? (
        <Card className="glass-card--primary p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <Brain className="h-8 w-8 text-purple-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-50 mb-1">Learning Focus Mode</h3>
            <p className="text-sm text-slate-400">
              Enter deep focus for your learning session
            </p>
          </div>

          <div className="space-y-2 max-w-xs mx-auto">
            <Label className="text-slate-200">Focus Duration (minutes)</Label>
            <Input
              type="number"
              value={plannedMinutes}
              onChange={(e) => setPlannedMinutes(e.target.value)}
              min="5"
              max="120"
              className="bg-slate-900/50 border-white/10 text-white text-center text-lg"
            />
          </div>

          <Button
            onClick={startFocusSession}
            disabled={isStarting}
            className="btn-primary w-full max-w-xs"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Focus Session
          </Button>
        </Card>
      ) : (
        <Card className="glass-card--primary p-6 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center animate-pulse">
            <Brain className="h-10 w-10 text-white" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-50 mb-2">Focus Active</h3>
            <div className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              {formatTime(timer)}
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Planned: {activeSession.planned_minutes} minutes
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            {!isPaused ? (
              <Button
                onClick={pauseTimer}
                variant="outline"
                className="border-white/10"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                onClick={resumeTimer}
                className="btn-primary"
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            <Button
              onClick={endFocusSession}
              disabled={isEnding}
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              End Session
            </Button>
          </div>
        </Card>
      )}

      <div className="glass-card--primary p-4 rounded-xl">
        <h4 className="text-sm font-semibold text-slate-200 mb-2">Tips for Deep Focus</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Mute all notifications</li>
          <li>• Close unnecessary tabs</li>
          <li>• Have water nearby</li>
          <li>• Take breaks every 25-50 minutes</li>
        </ul>
      </div>
    </div>
  );
};