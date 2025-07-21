import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, Calendar as CalendarIcon, Clock, Zap, Coins, Trophy } from "lucide-react";
import { format } from "date-fns";
import { useFocusRecovery } from "@/hooks/useFocusRecovery";
import FocusRecoveryDashboard from "./FocusRecoveryDashboard";
import { toast } from "@/hooks/use-toast";

const FocusScoreCard = () => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [focusEndTime, setFocusEndTime] = useState<Date | null>(null);
  const [focusStartTime, setFocusStartTime] = useState<Date | null>(null);
  const [showRecoveryDashboard, setShowRecoveryDashboard] = useState(false);
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [focusScore, setFocusScore] = useState(87);
  const [interruptions, setInterruptions] = useState(0);

  // Mock data for UCT tokens and community ranking
  const [uctTokens, setUctTokens] = useState(1247);
  const [communityRanking, setCommunityRanking] = useState(15); // Top 15%

  const { 
    startFocusSession, 
    endFocusSession, 
    isNotificationsMuted 
  } = useFocusRecovery();

  const handleStartFocus = () => {
    if (selectedDate && startTime && endTime) {
      const [startHour, startMinute] = startTime.split(':');
      const [endHour, endMinute] = endTime.split(':');
      
      const focusStart = new Date(selectedDate);
      focusStart.setHours(parseInt(startHour), parseInt(startMinute));
      
      const focusEnd = new Date(selectedDate);
      focusEnd.setHours(parseInt(endHour), parseInt(endMinute));
      
      const plannedMinutes = (focusEnd.getTime() - focusStart.getTime()) / (1000 * 60);
      
      setFocusStartTime(focusStart);
      setFocusEndTime(focusEnd);
      setIsFocusActive(true);
      setInterruptions(0);
      setIsCalendarOpen(false);
      
      // Start the focus session
      startFocusSession(plannedMinutes);
    }
  };

  const handleEndFocus = () => {
    if (focusStartTime && focusEndTime) {
      const now = new Date();
      const actualMinutes = (now.getTime() - focusStartTime.getTime()) / (1000 * 60);
      const plannedMinutes = (focusEndTime.getTime() - focusStartTime.getTime()) / (1000 * 60);
      
      const recovery = endFocusSession(plannedMinutes, actualMinutes, interruptions);
      setRecoveryData(recovery);
      setFocusScore(recovery.focusScore);
      setIsFocusActive(false);
      setShowRecoveryDashboard(true);
    }
  };

  const handleFocusInterruption = () => {
    setInterruptions(prev => prev + 1);
    toast({
      title: "⚠️ Focus Interrupted",
      description: "Try to get back on track! Your score will be adjusted.",
      variant: "destructive"
    });
  };

  const calculateTimeRemaining = () => {
    if (!focusEndTime) return "00:00";
    
    const now = new Date();
    const timeLeft = focusEndTime.getTime() - now.getTime();
    
    if (timeLeft <= 0) {
      if (isFocusActive) {
        handleEndFocus();
      }
      return "00:00";
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const calculateFocusDuration = () => {
    if (!focusStartTime || !focusEndTime) return "0h 0m";
    
    const duration = focusEndTime.getTime() - focusStartTime.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Update timer every minute
  useEffect(() => {
    if (isFocusActive) {
      const interval = setInterval(() => {
        calculateTimeRemaining();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [isFocusActive, focusEndTime]);

  return (
    <>
      {/* Active Focus Mode Card */}
      {isFocusActive && (
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none mb-4">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm font-medium mb-1 flex items-center justify-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Focus Mode Active</span>
              </div>
              <div className="text-2xl font-bold">{calculateTimeRemaining()}</div>
              <div className="text-xs opacity-90 mb-3">Time remaining</div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleFocusInterruption}
                  className="text-purple-600 bg-white hover:bg-gray-100"
                >
                  Report Break
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleEndFocus}
                  className="text-purple-600 bg-white hover:bg-gray-100"
                >
                  End Early
                </Button>
              </div>
              {interruptions > 0 && (
                <div className="text-xs mt-2 opacity-80">
                  Interruptions: {interruptions}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Focus Summary Section - 3 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-6">
        {/* Focus Score Card */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Focus Score</p>
                <div className="flex items-center space-x-3">
                  <p className="text-3xl font-bold text-gray-900">{focusScore}%</p>
                  <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="transition-all duration-200 hover:scale-105"
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Schedule Focus Time</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Select Date</label>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md border pointer-events-auto"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Start Time</label>
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">End Time</label>
                            <input
                              type="time"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Focus Mode</p>
                            <p className="text-xs text-gray-600">Mute all notifications</p>
                          </div>
                          <Switch
                            checked={focusModeEnabled}
                            onCheckedChange={setFocusModeEnabled}
                          />
                        </div>
                        
                        <Button 
                          onClick={handleStartFocus}
                          disabled={!selectedDate}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Start Focus Session
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {isNotificationsMuted && (
                  <p className="text-xs text-purple-600 font-medium mt-1">🔕 Notifications Muted</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UCT Tokens Card */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">UCT Tokens Earned</p>
                <p className="text-3xl font-bold text-gray-900">{uctTokens.toLocaleString()}</p>
                <p className="text-xs text-amber-600 font-medium">+47 today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Ranking Card */}
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Community Ranking</p>
                <p className="text-3xl font-bold text-gray-900">Top {communityRanking}%</p>
                <p className="text-xs text-emerald-600 font-medium">↗ +2% this week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Focus Recovery Dashboard */}
      <Dialog open={showRecoveryDashboard} onOpenChange={setShowRecoveryDashboard}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
          {recoveryData && (
            <FocusRecoveryDashboard
              data={recoveryData}
              focusDuration={calculateFocusDuration()}
              onStartCatchUp={() => {
                setShowRecoveryDashboard(false);
                toast({
                  title: "🚀 Starting Catch Up",
                  description: "Let's tackle those high priority items first!"
                });
              }}
              onReviewLater={() => {
                setShowRecoveryDashboard(false);
                toast({
                  title: "⏰ Review Scheduled",
                  description: "We'll remind you to catch up later."
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FocusScoreCard;
