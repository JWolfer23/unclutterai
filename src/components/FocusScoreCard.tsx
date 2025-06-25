
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";

const FocusScoreCard = () => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [focusEndTime, setFocusEndTime] = useState<Date | null>(null);

  const handleStartFocus = () => {
    if (selectedDate && startTime && endTime) {
      const [startHour, startMinute] = startTime.split(':');
      const [endHour, endMinute] = endTime.split(':');
      
      const focusStart = new Date(selectedDate);
      focusStart.setHours(parseInt(startHour), parseInt(startMinute));
      
      const focusEnd = new Date(selectedDate);
      focusEnd.setHours(parseInt(endHour), parseInt(endMinute));
      
      setFocusEndTime(focusEnd);
      setIsFocusActive(true);
      setIsCalendarOpen(false);
    }
  };

  const calculateTimeRemaining = () => {
    if (!focusEndTime) return "00:00";
    
    const now = new Date();
    const timeLeft = focusEndTime.getTime() - now.getTime();
    
    if (timeLeft <= 0) {
      setIsFocusActive(false);
      return "00:00";
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {isFocusActive && (
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none mb-4">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm font-medium mb-1">Focus Mode Active</div>
              <div className="text-2xl font-bold">{calculateTimeRemaining()}</div>
              <div className="text-xs opacity-90">Time remaining</div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogTrigger asChild>
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 cursor-pointer hover:shadow-lg transition-all duration-200 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Focus Score</p>
                    <p className="text-3xl font-bold text-gray-900">87%</p>
                  </div>
                </div>
                <div className="text-right">
                  <CalendarIcon className="w-5 h-5 text-purple-600 mb-2" />
                  <p className="text-xs text-gray-500">Click to schedule</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
    </>
  );
};

export default FocusScoreCard;
