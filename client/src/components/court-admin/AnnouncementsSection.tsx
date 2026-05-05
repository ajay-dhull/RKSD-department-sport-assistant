import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Megaphone, Pin } from "lucide-react";
import { format } from "date-fns";

interface AnnouncementData {
  id?: string;
  title: string;
  message: string;
  priority?: string;
  is_pinned?: boolean;
  expiry_date?: string | null;
  department_id?: string | null;
}

export function AnnouncementsSection() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementData | null>(null);
  const [formData, setFormData] = useState<AnnouncementData>({
    title: "",
    message: "",
    priority: "normal",
    is_pinned: false,
    expiry_date: null,
    department_id: null,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: announcementsData } = useQuery({
    queryKey: ["/api/court-admin/announcements"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/announcements");
      if (!res.ok) throw new Error("Failed to fetch announcements");
      return await res.json();
    },
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["/api/court-admin/departments"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      return await res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AnnouncementData) => {
      const res = await fetch("/api/court-admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create announcement");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/announcements"] });
      toast({ title: "Success", description: "Announcement created successfully" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: AnnouncementData & { id: string }) => {
      const res = await fetch(`/api/court-admin/announcements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update announcement");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/announcements"] });
      toast({ title: "Success", description: "Announcement updated successfully" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/court-admin/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete announcement");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/announcements"] });
      toast({ title: "Success", description: "Announcement deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      priority: "normal",
      is_pinned: false,
      expiry_date: null,
      department_id: null,
    });
    setIsCreateOpen(false);
    setEditingAnnouncement(null);
  };

  const handleSubmit = () => {
    if (editingAnnouncement?.id) {
      updateMutation.mutate({ ...formData, id: editingAnnouncement.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority || "normal",
      is_pinned: announcement.is_pinned || false,
      expiry_date: announcement.expiry_date ? announcement.expiry_date.split('T')[0] : null,
      department_id: announcement.department_id || null,
    });
    setIsCreateOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Announcements</h3>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage court announcements that the assistant can read to users
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Announcement
        </Button>
      </div>

      <div className="space-y-4">
        {announcementsData?.announcements?.map((announcement: any) => (
          <Card key={announcement.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Megaphone className="w-5 h-5 text-purple-600" />
                    {announcement.is_pinned && (
                      <Pin className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                    {announcement.department && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {announcement.department.name}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {format(new Date(announcement.created_at), 'PP')}
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-gray-900 mb-2">{announcement.title}</h4>
                  <p className="text-sm text-gray-700 mb-3">{announcement.message}</p>
                  
                  {announcement.expiry_date && (
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Expires:</span>{' '}
                      {format(new Date(announcement.expiry_date), 'PP')}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(announcement)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(announcement.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!announcementsData?.announcements || announcementsData.announcements.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              No announcements found. Click "Add Announcement" to create one.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "Add New Announcement"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter announcement title"
              />
            </div>

            <div>
              <Label>Message *</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter announcement message"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.expiry_date || ""}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value || null })}
                />
              </div>
            </div>

            <div>
              <Label>Department (Optional)</Label>
              <Select value={formData.department_id || ""} onValueChange={(value) => setFormData({ ...formData, department_id: value || null })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departmentsData?.departments?.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="pinned"
                checked={formData.is_pinned}
                onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
              />
              <Label htmlFor="pinned" className="cursor-pointer">
                Pin this announcement (shows first)
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.title || !formData.message || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingAnnouncement ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
