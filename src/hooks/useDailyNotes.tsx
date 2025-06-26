
import { useState, useEffect, useCallback } from "react";

interface DailyNote {
  id: string;
  date: string;
  content: string;
  summary?: string;
  mood?: string;
  lastModified: number;
}

const DAILY_NOTES_KEY = "unclutter-daily-notes";

export const useDailyNotes = () => {
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Load notes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(DAILY_NOTES_KEY);
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem(DAILY_NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  const getCurrentNote = useCallback(() => {
    return notes.find(note => note.date === currentDate);
  }, [notes, currentDate]);

  const saveNote = useCallback((content: string, mood?: string) => {
    setNotes(prevNotes => {
      const existingIndex = prevNotes.findIndex(note => note.date === currentDate);
      const noteData: DailyNote = {
        id: currentDate,
        date: currentDate,
        content,
        mood,
        lastModified: Date.now(),
        summary: existingIndex >= 0 ? prevNotes[existingIndex].summary : undefined
      };

      if (existingIndex >= 0) {
        const updated = [...prevNotes];
        updated[existingIndex] = noteData;
        return updated;
      } else {
        return [...prevNotes, noteData];
      }
    });
  }, [currentDate]);

  const generateSummary = useCallback(async (noteContent: string) => {
    if (!noteContent.trim()) return;
    
    setIsGeneratingSummary(true);
    
    try {
      // Simulate AI summary generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simple AI-like summary generation (in a real app, this would call an AI API)
      const sentences = noteContent.split('.').filter(s => s.trim().length > 10);
      const themes = [];
      
      if (noteContent.toLowerCase().includes('client') || noteContent.toLowerCase().includes('meeting')) {
        themes.push('client interactions');
      }
      if (noteContent.toLowerCase().includes('project') || noteContent.toLowerCase().includes('goal')) {
        themes.push('project planning');
      }
      if (noteContent.toLowerCase().includes('idea') || noteContent.toLowerCase().includes('think')) {
        themes.push('creative thinking');
      }
      if (noteContent.toLowerCase().includes('feel') || noteContent.toLowerCase().includes('mood')) {
        themes.push('personal reflections');
      }
      
      const summary = themes.length > 0 
        ? `Today's themes: ${themes.join(', ')}. Key points: ${sentences.slice(0, 2).join('.').trim()}.`
        : `Summary: ${sentences.slice(0, 2).join('.').trim()}.`;

      setNotes(prevNotes => {
        const updated = [...prevNotes];
        const noteIndex = updated.findIndex(note => note.date === currentDate);
        if (noteIndex >= 0) {
          updated[noteIndex] = { ...updated[noteIndex], summary };
        }
        return updated;
      });
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [currentDate]);

  const bringForward = useCallback((sourceDate: string) => {
    const sourceNote = notes.find(note => note.date === sourceDate);
    if (!sourceNote) return;

    const currentNote = getCurrentNote();
    const newContent = currentNote 
      ? `${currentNote.content}\n\n--- From ${sourceDate} ---\n${sourceNote.content}`
      : `--- From ${sourceDate} ---\n${sourceNote.content}`;
    
    saveNote(newContent, currentNote?.mood);
  }, [notes, getCurrentNote, saveNote]);

  const getAvailableDates = useCallback(() => {
    return notes.map(note => note.date).sort((a, b) => b.localeCompare(a));
  }, [notes]);

  return {
    notes,
    currentDate,
    setCurrentDate,
    getCurrentNote,
    saveNote,
    generateSummary,
    bringForward,
    getAvailableDates,
    isGeneratingSummary
  };
};
