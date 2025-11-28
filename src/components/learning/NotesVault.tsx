import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLearning } from "@/hooks/useLearning";
import { FileText, Plus, Search, Trash2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const NotesVault = () => {
  const { notes, sources, addNote, deleteNote, isAddingNote } = useLearning();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState<string>("note");
  const [sourceId, setSourceId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = () => {
    if (!title || !content) return;

    addNote({
      title,
      content,
      note_type: noteType,
      source_id: sourceId || null,
      tags: JSON.stringify(tags),
    });

    setTitle("");
    setContent("");
    setSourceId("");
    setTags([]);
    setShowForm(false);
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const filteredNotes = notes?.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="pl-10 bg-slate-900/50 border-white/10 text-white"
        />
      </div>

      {/* Add Note Button */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="btn-primary w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add New Note
        </Button>
      )}

      {/* Add Note Form */}
      {showForm && (
        <Card className="glass-card--primary p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-200">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="bg-slate-900/50 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Content *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes here..."
              rows={6}
              className="bg-slate-900/50 border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Note Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger className="bg-slate-900/50 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="flashcard">Flashcard</SelectItem>
                  <SelectItem value="summary">Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Link to Source</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger className="bg-slate-900/50 border-white/10 text-white">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {sources?.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTag()}
                placeholder="Add tag..."
                className="bg-slate-900/50 border-white/10 text-white"
              />
              <Button onClick={addTag} variant="outline" className="border-white/10">
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-purple-500/10 text-purple-300 border border-purple-400/40"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-2">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!title || !content || isAddingNote} className="btn-primary flex-1">
              Save Note
            </Button>
            <Button onClick={() => setShowForm(false)} variant="outline" className="border-white/10">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Notes List */}
      {filteredNotes && filteredNotes.length > 0 ? (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const noteTags = note.tags ? JSON.parse(note.tags as string) : [];
            return (
              <Card key={note.id} className="glass-card--primary p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-purple-300" />
                      <h4 className="text-sm font-medium text-slate-50">{note.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2">{note.content}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/40 capitalize">
                        {note.note_type}
                      </span>
                      {noteTags.map((tag: string) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-purple-500/10 text-purple-300 border border-purple-400/40 text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNote(note.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="glass-card--primary p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-slate-600" />
          <p className="text-sm text-slate-400">
            {searchQuery ? "No notes found" : "No notes yet. Start adding your learning notes!"}
          </p>
        </Card>
      )}
    </div>
  );
};