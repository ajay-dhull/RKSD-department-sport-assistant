import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Save, Edit, Plus, Trash2, Library, FlaskConical, Trophy, Home, Bus, HeartPulse, Coffee, Wifi, Building } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FacilitiesInfoSectionProps {
  data: any;
  onUpdate: () => void;
}

interface Facility {
  id: string;
  type: string;
  name: string;
  description: string;
  capacity?: string;
  timings?: string;
}

const facilityTypes = [
  { value: "library", label: "Library", icon: Library },
  { value: "laboratory", label: "Laboratory", icon: FlaskConical },
  { value: "sports", label: "Sports", icon: Trophy },
  { value: "hostel", label: "Hostel", icon: Home },
  { value: "transport", label: "Transport", icon: Bus },
  { value: "medical", label: "Medical / First Aid", icon: HeartPulse },
  { value: "cafeteria", label: "Cafeteria", icon: Coffee },
  { value: "wifi", label: "Wi-Fi / IT Infrastructure", icon: Wifi },
  { value: "auditorium", label: "Auditorium / Seminar Hall", icon: Building },
  { value: "other", label: "Other Facility", icon: Building },
];

export function FacilitiesInfoSection({ data, onUpdate }: FacilitiesInfoSectionProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("adminToken");
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [newFacility, setNewFacility] = useState({ type: "", name: "", description: "", capacity: "", timings: "" });
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingFacility, setIsAddingFacility] = useState(false);

  const { data: facilitiesData } = useQuery({
    queryKey: ["/api/admin/general-info/facilities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/facilities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (facilitiesData?.facilities) {
      setFacilities(facilitiesData.facilities);
    }
  }, [facilitiesData]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/general-info/facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ facilities: data }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Facilities updated successfully" });
      setIsEditing(false);
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(facilities);
  };

  const handleAddFacility = () => {
    if (!newFacility.type || !newFacility.name) {
      toast({ title: "Error", description: "Type and name are required", variant: "destructive" });
      return;
    }
    const facility: Facility = {
      id: Date.now().toString(),
      ...newFacility,
    };
    setFacilities([...facilities, facility]);
    setNewFacility({ type: "", name: "", description: "", capacity: "", timings: "" });
    setIsAddingFacility(false);
    toast({ title: "Success", description: "Facility added" });
  };

  const handleUpdateFacility = () => {
    if (!editingFacility) return;
    setFacilities(facilities.map((f) => (f.id === editingFacility.id ? editingFacility : f)));
    setEditingFacility(null);
    toast({ title: "Success", description: "Facility updated" });
  };

  const handleDeleteFacility = (id: string) => {
    setFacilities(facilities.filter((f) => f.id !== id));
    toast({ title: "Success", description: "Facility removed" });
  };

  const getFacilityIcon = (type: string) => {
    const facilityType = facilityTypes.find((ft) => ft.value === type);
    return facilityType ? facilityType.icon : Building;
  };

  const groupedFacilities = facilities.reduce((acc, facility) => {
    if (!acc[facility.type]) acc[facility.type] = [];
    acc[facility.type].push(facility);
    return acc;
  }, {} as Record<string, Facility[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">College Facilities</h3>
          <p className="text-sm text-gray-600 mt-1">Manage all facilities available at the college</p>
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
        <Dialog open={isAddingFacility} onOpenChange={setIsAddingFacility}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add New Facility
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Facility</DialogTitle>
              <DialogDescription>Add a new facility to your college</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Facility Type *</Label>
                <Select
                  value={newFacility.type}
                  onValueChange={(value) => setNewFacility({ ...newFacility, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={newFacility.name}
                  onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                  placeholder="e.g., Central Library, Physics Lab"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input
                    value={newFacility.capacity}
                    onChange={(e) => setNewFacility({ ...newFacility, capacity: e.target.value })}
                    placeholder="e.g., 200 students"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timings</Label>
                  <Input
                    value={newFacility.timings}
                    onChange={(e) => setNewFacility({ ...newFacility, timings: e.target.value })}
                    placeholder="e.g., 9 AM - 5 PM"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newFacility.description}
                  onChange={(e) => setNewFacility({ ...newFacility, description: e.target.value })}
                  placeholder="Detailed description..."
                  rows={4}
                />
              </div>
              <Button onClick={handleAddFacility} className="w-full">
                Add Facility
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="grid grid-cols-1 gap-4">
        {Object.entries(groupedFacilities).map(([type, typeFacilities]) => {
          const facilityTypeInfo = facilityTypes.find((ft) => ft.value === type);
          const Icon = facilityTypeInfo?.icon || Building;
          
          return (
            <Card key={type}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {facilityTypeInfo?.label || type}
                  <span className="text-sm font-normal text-gray-500">({typeFacilities.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {typeFacilities.map((facility) => (
                    <div key={facility.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{facility.name}</h4>
                          {facility.description && (
                            <p className="text-sm text-gray-600 mt-1">{facility.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 mt-2">
                            {facility.capacity && (
                              <span className="text-xs text-gray-500">
                                <span className="font-medium">Capacity:</span> {facility.capacity}
                              </span>
                            )}
                            {facility.timings && (
                              <span className="text-xs text-gray-500">
                                <span className="font-medium">Timings:</span> {facility.timings}
                              </span>
                            )}
                          </div>
                        </div>
                        {isEditing && (
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingFacility(facility)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Facility</DialogTitle>
                                </DialogHeader>
                                {editingFacility && editingFacility.id === facility.id && (
                                  <div className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                      <Label>Name *</Label>
                                      <Input
                                        value={editingFacility.name}
                                        onChange={(e) => setEditingFacility({ ...editingFacility, name: e.target.value })}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Capacity</Label>
                                        <Input
                                          value={editingFacility.capacity || ""}
                                          onChange={(e) => setEditingFacility({ ...editingFacility, capacity: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Timings</Label>
                                        <Input
                                          value={editingFacility.timings || ""}
                                          onChange={(e) => setEditingFacility({ ...editingFacility, timings: e.target.value })}
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Description</Label>
                                      <Textarea
                                        value={editingFacility.description}
                                        onChange={(e) => setEditingFacility({ ...editingFacility, description: e.target.value })}
                                        rows={4}
                                      />
                                    </div>
                                    <Button onClick={handleUpdateFacility} className="w-full">
                                      Update Facility
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteFacility(facility.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {facilities.length === 0 && (
          <Card>
            <CardContent className="text-center py-12 text-gray-500">
              <Library className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No facilities added yet</p>
              <p className="text-xs mt-1">Click "Add New Facility" to get started</p>
            </CardContent>
          </Card>
        )}
      </div>

      {facilitiesData && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(facilitiesData.updated_at || Date.now()).toLocaleString()}
        </div>
      )}
    </div>
  );
}
