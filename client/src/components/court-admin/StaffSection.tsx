import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, User, Mail, Phone } from "lucide-react";

interface StaffData {
  id?: string;
  full_name: string;
  employee_id: string;
  department_id?: string | null;
  designation: string;
  role?: string;
  email?: string;
  phone?: string;
  assigned_building_id?: string | null;
  assigned_room_id?: string | null;
  photo_url?: string;
}

export function StaffSection() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffData | null>(null);
  const [formData, setFormData] = useState<StaffData>({
    full_name: "",
    employee_id: "",
    department_id: null,
    designation: "",
    role: "",
    email: "",
    phone: "",
    assigned_building_id: null,
    assigned_room_id: null,
    photo_url: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staffData } = useQuery({
    queryKey: ["/api/court-admin/staff"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
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

  const { data: buildingsData } = useQuery({
    queryKey: ["/api/court-admin/buildings"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/buildings");
      if (!res.ok) throw new Error("Failed to fetch buildings");
      return await res.json();
    },
  });

  const { data: roomsData } = useQuery({
    queryKey: ["/api/court-admin/rooms"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return await res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: StaffData) => {
      const res = await fetch("/api/court-admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/staff"] });
      toast({ title: "Success", description: "Staff member created successfully" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: StaffData & { id: string }) => {
      const res = await fetch(`/api/court-admin/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update staff");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/staff"] });
      toast({ title: "Success", description: "Staff member updated successfully" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/court-admin/staff/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete staff");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/staff"] });
      toast({ title: "Success", description: "Staff member deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      employee_id: "",
      department_id: null,
      designation: "",
      role: "",
      email: "",
      phone: "",
      assigned_building_id: null,
      assigned_room_id: null,
      photo_url: "",
    });
    setIsCreateOpen(false);
    setEditingStaff(null);
  };

  const handleSubmit = () => {
    if (editingStaff?.id) {
      updateMutation.mutate({ ...formData, id: editingStaff.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (staff: any) => {
    setEditingStaff(staff);
    setFormData({
      full_name: staff.full_name,
      employee_id: staff.employee_id,
      department_id: staff.department_id || null,
      designation: staff.designation,
      role: staff.role || "",
      email: staff.email || "",
      phone: staff.phone || "",
      assigned_building_id: staff.assigned_building_id || null,
      assigned_room_id: staff.assigned_room_id || null,
      photo_url: staff.photo_url || "",
    });
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Staff Directory</h3>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffData?.staff?.map((staff: any) => (
          <Card key={staff.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{staff.full_name}</h4>
                  <p className="text-xs text-gray-600">{staff.employee_id}</p>
                  <p className="text-sm text-gray-700 mt-1">{staff.designation}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {staff.department && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Dept:</span> {staff.department.name}
                  </p>
                )}
                {staff.email && (
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {staff.email}
                  </p>
                )}
                {staff.phone && (
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {staff.phone}
                  </p>
                )}
                {staff.building && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Building:</span> {staff.building.name}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(staff)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(staff.id)}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!staffData?.staff || staffData.staff.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center text-gray-500">
              No staff members found. Click "Add Staff Member" to create one.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label>Employee ID *</Label>
                <Input
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  placeholder="e.g., EMP-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Designation *</Label>
                <Input
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g., Clerk, Registrar"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Administrative"
                />
              </div>
            </div>

            <div>
              <Label>Department</Label>
              <Select value={formData.department_id || ""} onValueChange={(value) => setFormData({ ...formData, department_id: value || null })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {departmentsData?.departments?.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assigned Building</Label>
                <Select value={formData.assigned_building_id || ""} onValueChange={(value) => setFormData({ ...formData, assigned_building_id: value || null })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {buildingsData?.buildings?.map((building: any) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned Room</Label>
                <Select value={formData.assigned_room_id || ""} onValueChange={(value) => setFormData({ ...formData, assigned_room_id: value || null })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {roomsData?.rooms?.map((room: any) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.room_number} - {room.room_name || room.purpose}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.full_name || !formData.employee_id || !formData.designation || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingStaff ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
