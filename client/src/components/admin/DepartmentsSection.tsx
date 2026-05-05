import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Building2, Edit, Trash2, Plus, Users, BookOpen, ExternalLink, Eye, EyeOff, Copy, Check } from "lucide-react";

interface Department {
  id: string;
  name: string;
  slug: string;
  department_id: string;
  head_name: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  panel_link: string;
  is_active: boolean;
  created_at: string;
}

export function DepartmentsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [showCredentials, setShowCredentials] = useState<{id: string; password: string} | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    head_name: "",
    contact_email: "",
    contact_phone: "",
    description: "",
  });

  const token = localStorage.getItem("adminToken");

  const { data: departmentsData, refetch } = useQuery<{ departments: Department[] }>({
    queryKey: ["/api/head-admin/departments"],
    queryFn: async () => {
      const res = await fetch("/api/head-admin/departments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch departments");
      return await res.json();
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('departments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'departments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["/api/head-admin/departments"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/head-admin/departments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create department");
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/head-admin/departments"] });
      toast({ title: "Success", description: "Department created successfully" });
      setIsCreateOpen(false);
      setShowCredentials({
        id: data.credentials.department_id,
        password: data.credentials.password
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/head-admin/departments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update department");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/head-admin/departments"] });
      toast({ title: "Success", description: "Department updated successfully" });
      setEditingDept(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/head-admin/departments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete department");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/head-admin/departments"] });
      toast({ title: "Success", description: "Department deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      head_name: "",
      contact_email: "",
      contact_phone: "",
      description: "",
    });
  };

  const startEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name || "",
      head_name: dept.head_name || "",
      contact_email: dept.contact_email || "",
      contact_phone: dept.contact_phone || "",
      description: dept.description || "",
    });
  };

  const handleSubmit = () => {
    if (editingDept) {
      updateMutation.mutate({ 
        id: editingDept.id, 
        data: {
          head_name: formData.head_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          description: formData.description,
        }
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleStatus = (dept: Department) => {
    updateMutation.mutate({
      id: dept.id,
      data: { is_active: !dept.is_active }
    });
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const departments = departmentsData?.departments || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Departments Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Create and manage college departments</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Department
        </Button>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Department Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Computer Science"
              />
            </div>
            <div>
              <Label>Head of Department</Label>
              <Input
                value={formData.head_name}
                onChange={(e) => setFormData({ ...formData, head_name: e.target.value })}
                placeholder="e.g., Dr. Sharma"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="dept@college.edu"
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the department..."
                rows={3}
              />
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={!formData.name || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Department"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDept} onOpenChange={(open) => !open && setEditingDept(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Department: {editingDept?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Department ID (Read Only)</p>
              <p className="font-mono text-sm">{editingDept?.department_id}</p>
            </div>
            <div>
              <Label>Head of Department</Label>
              <Input
                value={formData.head_name}
                onChange={(e) => setFormData({ ...formData, head_name: e.target.value })}
                placeholder="e.g., Dr. Sharma"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="dept@college.edu"
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the department..."
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label>Status</Label>
                <p className="text-xs text-gray-500">Toggle department active status</p>
              </div>
              <Switch
                checked={editingDept?.is_active}
                onCheckedChange={() => editingDept && toggleStatus(editingDept)}
              />
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Department"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showCredentials} onOpenChange={() => setShowCredentials(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Department Created Successfully!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Save these credentials securely. The password will not be shown again.
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">Department ID</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono font-bold">{showCredentials?.id}</p>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(showCredentials?.id || "", "id")}>
                    {copiedField === "id" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 mb-1">Password</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono font-bold">{showCredentials?.password}</p>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(showCredentials?.password || "", "password")}>
                    {copiedField === "password" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowCredentials(null)} className="w-full">
              I've Saved the Credentials
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.id} className={`${!dept.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{dept.name}</CardTitle>
                </div>
                <Badge variant={dept.is_active ? "default" : "secondary"}>
                  {dept.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">{dept.description || "No description"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-1">
                {dept.head_name && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">HOD: {dept.head_name}</span>
                  </div>
                )}
                {dept.contact_email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-xs">{dept.contact_email}</span>
                  </div>
                )}
                {dept.contact_phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-xs">{dept.contact_phone}</span>
                  </div>
                )}
              </div>
              
              <div className="p-2 bg-gray-50 rounded text-xs">
                <p className="text-gray-500">Login ID: <span className="font-mono">{dept.department_id}</span></p>
                <p className="text-gray-500">Panel: <span className="font-mono">{dept.panel_link}</span></p>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(dept)} className="flex-1">
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={dept.panel_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" /> Panel
                  </a>
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this department?")) {
                      deleteMutation.mutate(dept.id);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {departments.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">No departments created yet</p>
              <p className="text-gray-400 text-sm mb-4">Create your first department to get started</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create Department
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
