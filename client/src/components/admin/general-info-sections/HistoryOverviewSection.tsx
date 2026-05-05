import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Save, Edit, Plus, Trash2, Award } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface HistoryOverviewSectionProps {
  data: any;
  onUpdate: () => void;
}

interface Achievement {
  id: string;
  year: string;
  title: string;
  description: string;
}

export function HistoryOverviewSection({ data, onUpdate }: HistoryOverviewSectionProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    short_overview: "",
    detailed_history: "",
    founder_name: "",
    founder_bio: "",
    founder_image_url: "",
  });

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievement, setNewAchievement] = useState({ year: "", title: "", description: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingAchievement, setIsAddingAchievement] = useState(false);

  const { data: historyData } = useQuery({
    queryKey: ["/api/admin/general-info/history-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/history-overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (historyData) {
      setFormData({
        short_overview: historyData.short_overview || "",
        detailed_history: historyData.detailed_history || "",
        founder_name: historyData.founder_name || "",
        founder_bio: historyData.founder_bio || "",
        founder_image_url: historyData.founder_image_url || "",
      });
      setAchievements(historyData.achievements || []);
    }
  }, [historyData]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/general-info/history-overview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "History & overview updated successfully" });
      setIsEditing(false);
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ ...formData, achievements });
  };

  const handleAddAchievement = () => {
    if (!newAchievement.year || !newAchievement.title) {
      toast({ title: "Error", description: "Year and title are required", variant: "destructive" });
      return;
    }
    const achievement: Achievement = {
      id: Date.now().toString(),
      ...newAchievement,
    };
    setAchievements([...achievements, achievement]);
    setNewAchievement({ year: "", title: "", description: "" });
    setIsAddingAchievement(false);
    toast({ title: "Success", description: "Achievement added" });
  };

  const handleDeleteAchievement = (id: string) => {
    setAchievements(achievements.filter((a) => a.id !== id));
    toast({ title: "Success", description: "Achievement removed" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">College History & Overview</h3>
          <p className="text-sm text-gray-600 mt-1">Institution's legacy, founders, and achievements</p>
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
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Overview & Introduction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="short_overview">Short Overview / Introduction *</Label>
              <Textarea
                id="short_overview"
                value={formData.short_overview}
                onChange={(e) => setFormData({ ...formData, short_overview: e.target.value })}
                disabled={!isEditing}
                placeholder="Brief introduction about the college (2-3 sentences)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detailed_history">Detailed History *</Label>
              <Textarea
                id="detailed_history"
                value={formData.detailed_history}
                onChange={(e) => setFormData({ ...formData, detailed_history: e.target.value })}
                disabled={!isEditing}
                placeholder="Complete history of the college, including major milestones, developments over the years..."
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">You can use markdown formatting for better presentation</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Founder's Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="founder_name">Founder's Name</Label>
                <Input
                  id="founder_name"
                  value={formData.founder_name}
                  onChange={(e) => setFormData({ ...formData, founder_name: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Name of the founder"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="founder_image_url">Founder's Image URL</Label>
                <Input
                  id="founder_image_url"
                  value={formData.founder_image_url}
                  onChange={(e) => setFormData({ ...formData, founder_image_url: e.target.value })}
                  disabled={!isEditing}
                  placeholder="URL to founder's photo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="founder_bio">Founder's Biography</Label>
              <Textarea
                id="founder_bio"
                value={formData.founder_bio}
                onChange={(e) => setFormData({ ...formData, founder_bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Brief biography of the founder..."
                rows={4}
              />
            </div>

            {formData.founder_image_url && (
              <div className="flex justify-center">
                <img
                  src={formData.founder_image_url}
                  alt="Founder"
                  className="w-32 h-32 object-cover rounded-lg border-2"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image";
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />
              Important Achievements & Milestones
            </CardTitle>
            {isEditing && (
              <Dialog open={isAddingAchievement} onOpenChange={setIsAddingAchievement}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Achievement / Milestone</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Year *</Label>
                      <Input
                        value={newAchievement.year}
                        onChange={(e) => setNewAchievement({ ...newAchievement, year: e.target.value })}
                        placeholder="e.g., 2020"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        value={newAchievement.title}
                        onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                        placeholder="e.g., NAAC A+ Accreditation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={newAchievement.description}
                        onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                        placeholder="Brief description..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleAddAchievement} className="w-full">
                      Add Achievement
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {achievements.length > 0 ? (
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-blue-600">{achievement.year}</span>
                          <span className="text-gray-400">•</span>
                          <span className="font-medium text-gray-900">{achievement.title}</span>
                        </div>
                        {achievement.description && (
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                        )}
                      </div>
                      {isEditing && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAchievement(achievement.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No achievements added yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {historyData && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(historyData.updated_at || Date.now()).toLocaleString()}
        </div>
      )}
    </div>
  );
}
