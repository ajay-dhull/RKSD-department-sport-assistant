import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Trophy, Image as ImageIcon, X, Loader2 } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  event_date?: string;
  image_url?: string;
  location?: string;
  is_active: boolean;
  departments?: { name: string };
}

const ACHIEVEMENT_TYPES = [
  "Gold Medal",
  "Silver Medal",
  "Bronze Medal",
  "Trophy",
  "National Award",
  "State Award",
  "University Award",
  "Championship",
  "Tournament Win",
  "Certificate of Merit",
  "Other Achievement",
];

const emptyForm = {
  title: "",
  description: "",
  event_type: "Trophy",
  event_date: "",
  location: "",
  image_url: "",
};

export function EventsManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: eventsData } = useQuery({ queryKey: ['/api/head-admin/events'] });

  const achievements: Achievement[] = (eventsData as any)?.events || [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData({ ...formData, image_url: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/head-admin/upload-image", { method: "POST", body: fd });
      if (!res.ok) return null;
      const { url } = await res.json();
      return url;
    } catch {
      return null;
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/head-admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add achievement');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/head-admin/events'] });
      resetForm();
      setIsCreateOpen(false);
      toast({ title: "Success", description: "Achievement added successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/head-admin/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update achievement');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/head-admin/events'] });
      setEditingItem(null);
      resetForm();
      toast({ title: "Success", description: "Achievement updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/head-admin/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/head-admin/events'] });
      toast({ title: "Success", description: "Achievement deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = async (isEdit: boolean) => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    let image_url = formData.image_url;

    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) image_url = uploaded;
      else toast({ title: "Warning", description: "Image upload failed, saving without image" });
    }
    setIsUploading(false);

    const payload = { ...formData, image_url };

    if (isEdit && editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const startEdit = (item: Achievement) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      event_type: item.event_type,
      event_date: item.event_date ? new Date(item.event_date).toISOString().slice(0, 10) : "",
      location: item.location || "",
      image_url: item.image_url || "",
    });
    setImagePreview(item.image_url || "");
    setIsCreateOpen(true);
  };

  const isEdit = !!editingItem;

  const achievementForm = (
    <div className="space-y-4">
      <div>
        <Label>Achievement Title *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Won Gold Medal in State Athletics Championship"
        />
      </div>

      <div>
        <Label>Achievement Type</Label>
        <Select value={formData.event_type} onValueChange={(v) => setFormData(prev => ({ ...prev, event_type: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACHIEVEMENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the achievement..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
          />
        </div>
        <div>
          <Label>Venue / Event</Label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., Kurukshetra University"
          />
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <Label className="flex items-center gap-2 mb-2">
          <ImageIcon className="h-4 w-4" />
          Achievement Photo (Optional)
        </Label>
        {imagePreview ? (
          <div className="relative inline-block">
            <img src={imagePreview} alt="preview" className="h-40 w-auto rounded-lg object-cover border border-gray-200" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
          >
            <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Click to upload photo</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP supported</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
      </div>

      <Button
        onClick={() => handleSubmit(isEdit)}
        className="w-full"
        disabled={!formData.title || isUploading || createMutation.isPending || updateMutation.isPending}
      >
        {isUploading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
        ) : isEdit ? "Update Achievement" : "Add Achievement"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Achievements</h2>
          <p className="text-gray-600 mt-1">Department achievements, awards & medals — shown to students by AI</p>
        </div>
        <Button onClick={() => { setEditingItem(null); resetForm(); setIsCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Achievement
        </Button>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditingItem(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Achievement" : "Add New Achievement"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update achievement details" : "Record a department achievement, award or medal"}
            </DialogDescription>
          </DialogHeader>
          {achievementForm}
        </DialogContent>
      </Dialog>

      {/* Achievement List */}
      {achievements.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No achievements added yet</p>
            <p className="text-sm text-gray-400 mt-1">Add medals, trophies and awards won by the department</p>
            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add First Achievement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {achievements.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group">
                  {/* Thumbnail or Trophy Icon */}
                  <div className="flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      </div>
                    )}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                      <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
                        {item.event_type}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 truncate">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-0.5">
                      {item.event_date && (
                        <span className="text-xs text-gray-400">
                          📅 {new Date(item.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {item.location && (
                        <span className="text-xs text-gray-400">📍 {item.location}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(item)}>
                      <Edit className="h-3.5 w-3.5 text-blue-500" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => deleteMutation.mutate(item.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
