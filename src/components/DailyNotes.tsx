
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { 
  Calendar as CalendarIcon,
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  ArrowUp,
  Eye,
  EyeOff
} from "lucide-react";
import { useDailyNotes } from "@/hooks/useDailyNotes";
import { sanitizeNoteContent } from "@/lib/inputSanitization";

const DailyNotes = () => {
  const {
    currentDate,
    setCurrentDate,
    getCurrentNote,
    saveNote,
    generateSummary,
    bringForward,
    getAvailableDates,
    isGeneratingSummary
  } = useDailyNotes();

  const [content, setContent] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string>("");

  const currentNote = getCurrentNote();
  const availableDates = getAvailableDates();

  // Load current note content when date changes
  useEffect(() => {
    if (currentNote) {
      setContent(currentNote.content);
      setSelectedMood(currentNote.mood || "");
    } else {
      setContent("");
      setSelectedMood("");
    }
  }, [currentNote]);

  // Auto-save with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== (currentNote?.content || "")) {
        saveNote(content, selectedMood);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, selectedMood, currentNote, saveNote]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentIndex = availableDates.indexOf(currentDate);
    if (direction === 'prev' && currentIndex < availableDates.length - 1) {
      setCurrentDate(availableDates[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setCurrentDate(availableDates[currentIndex - 1]);
    }
  };

  const moods = [
    { emoji: "😊", label: "Happy" },
    { emoji: "😌", label: "Calm" },
    { emoji: "🤔", label: "Thoughtful" },
    { emoji: "💪", label: "Motivated" },
    { emoji: "😴", label: "Tired" }
  ];

  const isToday = currentDate === new Date().toISOString().split('T')[0];

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Daily Notes</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('prev')}
              disabled={!availableDates.length || availableDates.indexOf(currentDate) >= availableDates.length - 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <CalendarIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('next')}
              disabled={!availableDates.length || availableDates.indexOf(currentDate) <= 0}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {formatDate(currentDate)} {isToday && <Badge variant="secondary" className="ml-2">Today</Badge>}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {showCalendar && (
          <div className="border rounded-lg p-3 bg-gray-50/50">
            <Calendar
              mode="single"
              selected={new Date(currentDate)}
              onSelect={(date) => {
                if (date) {
                  setCurrentDate(date.toISOString().split('T')[0]);
                  setShowCalendar(false);
                }
              }}
              className="w-full"
            />
          </div>
        )}

        {/* Mood Selection */}
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-sm text-gray-600 flex-shrink-0">Mood:</span>
          <div className="flex space-x-1 flex-wrap">
            {moods.map((mood) => (
              <Button
                key={mood.label}
                variant={selectedMood === mood.label ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedMood(selectedMood === mood.label ? "" : mood.label)}
                className="h-8 w-8 p-0 flex items-center justify-center flex-shrink-0"
                title={mood.label}
              >
                <span className="text-lg leading-none">{mood.emoji}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Note Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 italic">
              Write anything. I'll handle the summary.
            </p>
            {content.trim() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateSummary(content)}
                disabled={isGeneratingSummary}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGeneratingSummary ? "Summarizing..." : "AI Summary"}
              </Button>
            )}
          </div>

          <Textarea
            placeholder="How was your day? What's on your mind?"
            value={content}
            onChange={(e) => {
              const sanitized = sanitizeNoteContent(e.target.value);
              setContent(sanitized);
            }}
            maxLength={10000}
            className="min-h-[200px] bg-white/50 border-white/20 resize-none focus:bg-white/80 transition-colors"
          />
          <div className="text-xs text-muted-foreground text-right">
            {content.length}/10,000 characters
          </div>
        </div>

        {/* AI Summary */}
        {currentNote?.summary && (
          <div className="border rounded-lg p-4 bg-purple-50/50 border-purple-200/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">AI Summary</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSummary(!showSummary)}
              >
                {showSummary ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {showSummary && (
              <p className="text-sm text-purple-600">{currentNote.summary}</p>
            )}
          </div>
        )}

        {/* Previous Notes Navigation */}
        {availableDates.length > 1 && (
          <div className="space-y-2">
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Previous Notes</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableDates.filter(date => date !== currentDate).slice(0, 3).map((date) => (
                <div key={date} className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(date)}
                    className="text-xs"
                  >
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => bringForward(date)}
                    title="Bring forward to today"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyNotes;
