import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Building } from "lucide-react";

interface BuildingData {
  id?: string;
  name: string;
  building_code: string;
  description?: string;
  landmark?: string;
  directional_notes?: string;
  number_of_floors?: number;
  photo_url?: string;
}

export function BuildingsSection() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<BuildingData | null>(null);
  const [formData, setFormData] = useState<BuildingData>({
    name: "",
    building_code: "",
    description: "",
    landmark: "",
    directional_notes: "",
    number_of_floors: 1,
    photo_url: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: buildingsData } = useQuery({
    queryKey: ["/api/court-admin/buildings"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/buildings");
      if (!res.ok) throw new Error("Failed to fetch buildings");
      return await res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BuildingData) => {
      const res = await fetch("/api/court-admin/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create building");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/buildings"] });
      toast({ title: "Success", description: "Building created successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: BuildingData & { id: string }) => {
      const res = await fetch(`/api/court-admin/buildings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update building");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/buildings"] });
      toast({ title: "Success", description: "Building updated successfully" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/court-admin/buildings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete building");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/buildings"] });
      toast({ title: "Success", description: "Building deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      building_code: "",
      description: "",
      landmark: "",
      directional_notes: "",
      number_of_floors: 1,
      photo_url: "",
    });
    setIsCreateOpen(false);
    setEditingBuilding(null);
  };

  const handleSubmit = () => {
    if (editingBuilding?.id) {
      updateMutation.mutate({ ...formData, id: editingBuilding.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (building: any) => {
    setEditingBuilding(building);
    setFormData({
      name: building.name,
      building_code: building.building_code,
      description: building.description || "",
      landmark: building.landmark || "",
      directional_notes: building.directional_notes || "",
      number_of_floors: building.number_of_floors || 1,
      photo_url: building.photo_url || "",
    });
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Buildings Management</h3>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Building
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildingsData?.buildings?.map((building: any) => (
          <Card key={building.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{building.name}</h4>
                    <p className="text-sm text-gray-600">{building.building_code}</p>
                  </div>
                </div>
              </div>
              
              {building.description && (
                <p className="text-sm text-gray-700 mb-3">{building.description}</p>
              )}
              
              <div className="space-y-2 mb-4">
                {building.landmark && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Landmark:</span> {building.landmark}
                  </p>
                )}
                {building.number_of_floors && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Floors:</span> {building.number_of_floors}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(building)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(building.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!buildingsData?.buildings || buildingsData.buildings.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center text-gray-500">
              No buildings found. Click "Add Building" to create one.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBuilding ? "Edit Building" : "Add New Building"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Building Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Main Judicial Block"
                />
              </div>
              <div>
                <Label>Building Code *</Label>
                <Input
                  value={formData.building_code}
                  onChange={(e) => setFormData({ ...formData, building_code: e.target.value })}
                  placeholder="e.g., BLD-001"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter building description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Landmark</Label>
                <Input
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  placeholder="e.g., Near Main Gate"
                />
              </div>
              <div>
                <Label>Number of Floors</Label>
                <Input
                  type="number"
                  value={formData.number_of_floors}
                  onChange={(e) => setFormData({ ...formData, number_of_floors: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div>
              <Label>Directional Notes</Label>
              <Textarea
                value={formData.directional_notes}
                onChange={(e) => setFormData({ ...formData, directional_notes: e.target.value })}
                placeholder="e.g., Opposite canteen, near parking"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.building_code || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingBuilding ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
