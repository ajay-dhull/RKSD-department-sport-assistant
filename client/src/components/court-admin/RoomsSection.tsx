import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, DoorOpen } from "lucide-react";

interface RoomData {
  id?: string;
  room_number: string;
  room_name?: string;
  building_id: string;
  floor?: number;
  purpose?: string;
  in_charge_staff_id?: string | null;
  timing?: string;
  status?: string;
  photo_url?: string;
  notes?: string;
}

export function RoomsSection() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
  const [formData, setFormData] = useState<RoomData>({
    room_number: "",
    room_name: "",
    building_id: "",
    floor: 1,
    purpose: "",
    in_charge_staff_id: null,
    timing: "",
    status: "Open",
    photo_url: "",
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roomsData } = useQuery({
    queryKey: ["/api/court-admin/rooms"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
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

  const { data: staffData } = useQuery({
    queryKey: ["/api/court-admin/staff"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      return await res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RoomData) => {
      const res = await fetch("/api/court-admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create room");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/rooms"] });
      toast({ title: "Success", description: "Room created successfully" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: RoomData & { id: string }) => {
      const res = await fetch(`/api/court-admin/rooms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update room");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/rooms"] });
      toast({ title: "Success", description: "Room updated successfully" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/court-admin/rooms/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete room");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/rooms"] });
      toast({ title: "Success", description: "Room deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData({
      room_number: "",
      room_name: "",
      building_id: "",
      floor: 1,
      purpose: "",
      in_charge_staff_id: null,
      timing: "",
      status: "Open",
      photo_url: "",
      notes: "",
    });
    setIsCreateOpen(false);
    setEditingRoom(null);
  };

  const handleSubmit = () => {
    if (editingRoom?.id) {
      updateMutation.mutate({ ...formData, id: editingRoom.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      room_name: room.room_name || "",
      building_id: room.building_id,
      floor: room.floor || 1,
      purpose: room.purpose || "",
      in_charge_staff_id: room.in_charge_staff_id || null,
      timing: room.timing || "",
      status: room.status || "Open",
      photo_url: room.photo_url || "",
      notes: room.notes || "",
    });
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Rooms & Courtrooms Management</h3>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">In-charge</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {roomsData?.rooms?.map((room: any) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{room.room_number}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{room.room_name || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{room.building?.name || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{room.floor || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{room.purpose || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{room.in_charge?.full_name || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      room.status === 'Open' ? 'bg-green-100 text-green-800' :
                      room.status === 'Closed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(room)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(room.id)}>
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!roomsData?.rooms || roomsData.rooms.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No rooms found. Click "Add Room" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? "Edit Room" : "Add New Room"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Room Number *</Label>
                <Input
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  placeholder="e.g., 101, CR-5"
                />
              </div>
              <div>
                <Label>Room Name</Label>
                <Input
                  value={formData.room_name}
                  onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                  placeholder="e.g., Civil Court Room 1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Building *</Label>
                <Select value={formData.building_id} onValueChange={(value) => setFormData({ ...formData, building_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildingsData?.buildings?.map((building: any) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Floor</Label>
                <Input
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purpose</Label>
                <Input
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="e.g., Hearing room, Office"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="In Use">In Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>In-charge (Staff)</Label>
                <Select value={formData.in_charge_staff_id || ""} onValueChange={(value) => setFormData({ ...formData, in_charge_staff_id: value || null })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {staffData?.staff?.map((staff: any) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.full_name} ({staff.designation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timing</Label>
                <Input
                  value={formData.timing}
                  onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                  placeholder="e.g., 10:00 - 16:00"
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information about the room"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.room_number || !formData.building_id || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingRoom ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
