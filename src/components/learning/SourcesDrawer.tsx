import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useLearning } from "@/hooks/useLearning";
import { BookOpen, Video, FileText, Music, Link, X, Trash2 } from "lucide-react";

interface SourcesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sourceTypeIcons = {
  course: Link,
  book: BookOpen,
  pdf: FileText,
  video: Video,
  audio: Music,
  article: FileText,
};

export const SourcesDrawer = ({ open, onOpenChange }: SourcesDrawerProps) => {
  const { sources, addSource, updateSource, deleteSource, isAddingSource } = useLearning();
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<string>("course");
  const [url, setUrl] = useState("");
  const [isbn, setIsbn] = useState("");
  const [progress, setProgress] = useState([0]);

  const handleSubmit = () => {
    if (!title) return;

    addSource({
      title,
      source_type: sourceType,
      url: url || null,
      isbn: isbn || null,
      progress_percent: progress[0],
    });

    // Reset form
    setTitle("");
    setUrl("");
    setIsbn("");
    setProgress([0]);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass-card max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="text-slate-50">Link Learning Sources</DrawerTitle>
          <DrawerDescription className="text-slate-300">
            Add courses, books, PDFs, and other learning materials
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-6 overflow-y-auto">
          {/* Add New Source Form */}
          <div className="space-y-4 glass-card--primary p-4 rounded-2xl">
            <div className="space-y-2">
              <Label className="text-slate-200">Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Machine Learning Course"
                className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Source Type</Label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger className="bg-slate-900/50 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="book">Book</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-400"
              />
            </div>

            {sourceType === "book" && (
              <div className="space-y-2">
                <Label className="text-slate-200">ISBN (optional)</Label>
                <Input
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="ISBN-13"
                  className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-400"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-200">Progress: {progress[0]}%</Label>
              <Slider
                value={progress}
                onValueChange={setProgress}
                max={100}
                step={5}
                className="py-4"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!title || isAddingSource}
              className="btn-primary w-full"
            >
              Add Source
            </Button>
          </div>

          {/* Existing Sources List */}
          {sources && sources.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Your Sources</h3>
              {sources.map((source) => {
                const Icon = sourceTypeIcons[source.source_type as keyof typeof sourceTypeIcons];
                return (
                  <div key={source.id} className="glass-card--primary p-4 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-purple-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-slate-50 truncate">{source.title}</h4>
                          <p className="text-xs text-slate-400 capitalize">{source.source_type}</p>
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-400 hover:text-purple-300 truncate block"
                            >
                              {source.url}
                            </a>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSource(source.id)}
                        className="text-slate-400 hover:text-red-400 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-slate-200">{source.progress_percent}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                          style={{ width: `${source.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
