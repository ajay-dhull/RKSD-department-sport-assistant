import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Edit, Plus, Trash2, ChevronDown, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EnhancedAIInput } from "../EnhancedAIInput";
import { EnhancedAIPreview } from "../EnhancedAIPreview";

interface AdditionalInfoSectionProps {
  data: any;
  onUpdate: () => void;
}

interface InfoEntry {
  id: string;
  title: string;
  content: string;
  category?: string;
}

export function AdditionalInfoSection({ data, onUpdate }: AdditionalInfoSectionProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("adminToken");
  const queryClient = useQueryClient();
  
  const [entries, setEntries] = useState<InfoEntry[]>([]);
  const [newEntry, setNewEntry] = useState({ title: "", content: "", category: "" });
  const [editingEntry, setEditingEntry] = useState<InfoEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'manual' | 'ai'>('manual');
  
  // AI Mode State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [browserSupported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const { data: additionalInfoData } = useQuery({
    queryKey: ["/api/admin/general-info/additional-info"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/additional-info", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (additionalInfoData?.entries) {
      setEntries(additionalInfoData.entries);
    }
  }, [additionalInfoData]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/general-info/additional-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ entries: data }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info/additional-info"] });
      toast({ title: "Success", description: "Additional info updated successfully" });
      setIsEditing(false);
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(entries);
  };

  const handleOpenDialog = (mode: 'manual' | 'ai') => {
    setDialogMode(mode);
    setIsDialogOpen(true);
    setAiGeneratedData(null);
    setAiPrompt("");
  };

  // Manual Mode Functions
  const handleAddEntry = () => {
    if (!newEntry.title || !newEntry.content) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }
    const entry: InfoEntry = {
      id: Date.now().toString(),
      ...newEntry,
    };
    setEntries([...entries, entry]);
    setNewEntry({ title: "", content: "", category: "" });
    setIsDialogOpen(false);
    toast({ title: "Success", description: "Entry added" });
  };

  const handleUpdateEntry = () => {
    if (!editingEntry) return;
    setEntries(entries.map((e) => (e.id === editingEntry.id ? editingEntry : e)));
    setEditingEntry(null);
    toast({ title: "Success", description: "Entry updated" });
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
    toast({ title: "Success", description: "Entry removed" });
  };

  // AI Mode Functions
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: "Error", description: "Please enter a description", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          type: "additional_info",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate");
      }
      
      const result = await response.json();
      setAiGeneratedData(result);
      setCurrentPreviewIndex(0);
      toast({ title: "Success", description: "Information generated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmAI = () => {
    if (!aiGeneratedData) return;
    const newEntries = aiGeneratedData.entries || [aiGeneratedData];
    const entriesWithIds = newEntries.map((entry: any) => ({
      id: Date.now().toString() + Math.random(),
      title: entry.title,
      content: entry.content,
      category: entry.category || "",
    }));
    setEntries([...entries, ...entriesWithIds]);
    setAiGeneratedData(null);
    setAiPrompt("");
    setIsDialogOpen(false);
    toast({ 
      title: "Success", 
      description: `${entriesWithIds.length} entry/entries added successfully` 
    });
  };

  const handleRegenerateAI = () => {
    setAiGeneratedData(null);
    setCurrentPreviewIndex(0);
  };

  const handleEditAIEntry = (entry: any, index: number) => {
    const updatedEntries = [...(aiGeneratedData.entries || [aiGeneratedData])];
    updatedEntries[index] = entry;
    setAiGeneratedData({ ...aiGeneratedData, entries: updatedEntries });
  };

  const handleDeleteAIEntry = (index: number) => {
    const updatedEntries = [...(aiGeneratedData.entries || [aiGeneratedData])];
    updatedEntries.splice(index, 1);
    if (updatedEntries.length === 0) {
      setAiGeneratedData(null);
    } else {
      setAiGeneratedData({ ...aiGeneratedData, entries: updatedEntries });
    }
  };

  const handleToggleVoice = () => {
    if (!browserSupported) {
      toast({ title: "Not Supported", description: "Voice input not supported in this browser", variant: "destructive" });
      return;
    }
    setIsListening(!isListening);
    // Voice recognition logic would go here
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Additional Information</h3>
          <p className="text-sm text-gray-600 mt-1">Add custom information manually or with AI assistance</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save All"}
            </Button>
          </div>
        )}
      </div>

      {isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Information
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleOpenDialog('manual')}>
              Manual Mode
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenDialog('ai')}>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Mode (Smart Add)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'ai' ? "AI Mode - Add Information" : "Add Information"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'ai' 
                ? "Describe the information in natural language and AI will structure it for you" 
                : "Add additional information manually"}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === 'ai' ? (
            <>
              {!aiGeneratedData ? (
                <EnhancedAIInput
                  prompt={aiPrompt}
                  onPromptChange={setAiPrompt}
                  onGenerate={handleGenerateAI}
                  isGenerating={isGenerating}
                  isListening={isListening}
                  onToggleVoice={handleToggleVoice}
                  browserSupported={browserSupported}
                  placeholder="Describe the additional information you want to add..."
                  examples={[
                    "Add information about our alumni network and success stories",
                    "Add details about our international collaborations and exchange programs",
                    "Add information about our research publications and patents"
                  ]}
                  sectionType="information"
                />
              ) : (
                <EnhancedAIPreview
                  entries={aiGeneratedData.entries || [aiGeneratedData]}
                  currentIndex={currentPreviewIndex}
                  onIndexChange={setCurrentPreviewIndex}
                  renderPreview={(entry) => (
                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold text-gray-700 block mb-1">Title:</span>
                        <p className="text-gray-900 text-lg">{entry.title}</p>
                      </div>
                      {entry.category && (
                        <div>
                          <span className="font-semibold text-gray-700 block mb-1">Category:</span>
                          <p className="text-gray-900">{entry.category}</p>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-700 block mb-1">Content:</span>
                        <p className="text-gray-900 whitespace-pre-wrap">{entry.content}</p>
                      </div>
                    </div>
                  )}
                  onConfirmAll={handleConfirmAI}
                  onRegenerate={handleRegenerateAI}
                  onEditEntry={handleEditAIEntry}
                  onDeleteEntry={handleDeleteAIEntry}
                  confirmButtonText={`Add ${(aiGeneratedData.entries || [aiGeneratedData]).length} Entry/Entries`}
                  entryTypeName="Information"
                />
              )}
            </>
          ) : (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Input
                  id="category"
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                  placeholder="e.g., Alumni, Collaborations, Research"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  placeholder="Enter detailed content"
                  rows={6}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button onClick={() => setIsDialogOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleAddEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>No additional information added yet.</p>
              <p className="text-sm mt-2">Use the "Add Information" button to add custom content.</p>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{entry.title}</CardTitle>
                    {entry.category && (
                      <p className="text-sm text-gray-600 mt-1">Category: {entry.category}</p>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => setEditingEntry(entry)}
                        size="sm"
                        variant="ghost"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteEntry(entry.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Information</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={editingEntry.title}
                  onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category (Optional)</Label>
                <Input
                  id="edit-category"
                  value={editingEntry.category || ""}
                  onChange={(e) => setEditingEntry({ ...editingEntry, category: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">Content *</Label>
                <Textarea
                  id="edit-content"
                  value={editingEntry.content}
                  onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                  rows={6}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button onClick={() => setEditingEntry(null)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleUpdateEntry}>
                  <Save className="h-4 w-4 mr-2" />
                  Update Entry
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {additionalInfoData && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(additionalInfoData.updated_at || Date.now()).toLocaleString()}
        </div>
      )}
    </div>
  );
}
