import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";

interface DepartmentData {
  id?: string;
  name: string;
  slug: string;
  department_code: string;
  head_name?: string;
  head_designation?: string;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
}

export function DepartmentsSection() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentData | null>(null);
  const [formData, setFormData] = useState<DepartmentData>({
    name: "",
    slug: "",
    department_code: "",
    head_name: "",
    head_designation: "",
    contact_email: "",
    contact_phone: "",
    description: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: departmentsData } = useQuery({
    queryKey: ["/api/court-admin/departments"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      return await res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DepartmentData) => {
      const res = await fetch("/api/court-admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create department");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/departments"] });
      toast({ title: "Success", description: "Department created successfully" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: DepartmentData & { id: string }) => {
      const res = await fetch(`/api/court-admin/departments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update department");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/departments"] });
      toast({ title: "Success", description: "Department updated successfully" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/court-admin/departments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete department");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/departments"] });
      toast({ title: "Success", description: "Department deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      department_code: "",
      head_name: "",
      head_designation: "",
      contact_email: "",
      contact_phone: "",
      description: "",
    });
    setIsCreateOpen(false);
    setEditingDept(null);
  };

  const generateSlugAndCode = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const code = `DEPT-${slug.substring(0, 3).toUpperCase()}`;
    setFormData({ ...formData, name, slug, department_code: code });
  };

  const handleSubmit = () => {
    if (editingDept?.id) {
      updateMutation.mutate({ ...formData, id: editingDept.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (dept: any) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      slug: dept.slug,
      department_code: dept.department_code,
      head_name: dept.head_name || "",
      head_designation: dept.head_designation || "",
      contact_email: dept.contact_email || "",
      contact_phone: dept.contact_phone || "",
      description: dept.description || "",
    });
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Departments Management</h3>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departmentsData?.departments?.map((dept: any) => (
          <Card key={dept.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{dept.name}</h4>
                    <p className="text-xs text-gray-600">{dept.department_code}</p>
                  </div>
                </div>
              </div>

              {dept.description && (
                <p className="text-sm text-gray-700 mb-3">{dept.description}</p>
              )}

              <div className="space-y-2 mb-4">
                {dept.head_name && (
                  <div>
                    <p className="text-xs font-medium text-gray-600">Head:</p>
                    <p className="text-sm text-gray-900">{dept.head_name}</p>
                    {dept.head_designation && (
                      <p className="text-xs text-gray-600">{dept.head_designation}</p>
                    )}
                  </div>
                )}
                {dept.contact_email && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Email:</span> {dept.contact_email}
                  </p>
                )}
                {dept.contact_phone && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Phone:</span> {dept.contact_phone}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(dept)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(dept.id)}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!departmentsData?.departments || departmentsData.departments.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center text-gray-500">
              No departments found. Click "Add Department" to create one.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDept ? "Edit Department" : "Add New Department"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Department Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => generateSlugAndCode(e.target.value)}
                placeholder="e.g., Civil Court, Criminal Court"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Slug (Auto-generated)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., civil-court"
                />
              </div>
              <div>
                <Label>Department Code (Auto-generated)</Label>
                <Input
                  value={formData.department_code}
                  onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                  placeholder="e.g., DEPT-CIV"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter department description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Head Name</Label>
                <Input
                  value={formData.head_name}
                  onChange={(e) => setFormData({ ...formData, head_name: e.target.value })}
                  placeholder="e.g., Justice R.K. Sharma"
                />
              </div>
              <div>
                <Label>Head Designation</Label>
                <Input
                  value={formData.head_designation}
                  onChange={(e) => setFormData({ ...formData, head_designation: e.target.value })}
                  placeholder="e.g., Senior Judge"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="dept@court.gov.in"
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingDept ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
