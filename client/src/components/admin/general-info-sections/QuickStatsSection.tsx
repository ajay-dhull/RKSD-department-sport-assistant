import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Save, Edit, Users, UserCheck, Building2, GraduationCap, MapPin, Award, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface QuickStatsSectionProps {
  data: any;
  onUpdate: () => void;
}

export function QuickStatsSection({ data, onUpdate }: QuickStatsSectionProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    total_students: "",
    total_staff: "",
    total_departments: "",
    total_courses: "",
    campus_area: "",
    accreditations: "",
  });

  const [autoFetch, setAutoFetch] = useState({
    students: false,
    staff: true,
    departments: true,
    courses: true,
  });

  const [isEditing, setIsEditing] = useState(false);

  // Fetch stats data
  const { data: statsData, refetch } = useQuery({
    queryKey: ["/api/admin/general-info/quick-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/quick-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  // Fetch real-time counts
  const { data: liveCounts } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    if (statsData) {
      setFormData({
        total_students: statsData.total_students || "",
        total_staff: statsData.total_staff || "",
        total_departments: statsData.total_departments || "",
        total_courses: statsData.total_courses || "",
        campus_area: statsData.campus_area || "",
        accreditations: statsData.accreditations || "",
      });
      setAutoFetch({
        students: statsData.auto_fetch_students ?? false,
        staff: statsData.auto_fetch_staff ?? true,
        departments: statsData.auto_fetch_departments ?? true,
        courses: statsData.auto_fetch_courses ?? true,
      });
    }
  }, [statsData]);

  // Auto-apply live counts when auto-fetch is enabled
  useEffect(() => {
    if (liveCounts && isEditing) {
      const updates: any = {};
      if (autoFetch.students) updates.total_students = liveCounts.students?.toString() || "";
      if (autoFetch.staff) updates.total_staff = liveCounts.staff?.toString() || "";
      if (autoFetch.departments) updates.total_departments = liveCounts.departments?.toString() || "";
      if (autoFetch.courses) updates.total_courses = liveCounts.courses?.toString() || "";
      
      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({ ...prev, ...updates }));
      }
    }
  }, [liveCounts, autoFetch, isEditing]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/general-info/quick-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...data, autoFetch }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Quick stats updated successfully" });
      setIsEditing(false);
      onUpdate();
      refetch();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleRefresh = () => {
    refetch();
    toast({ title: "Refreshed", description: "Stats data refreshed from database" });
  };

  const statsItems = [
    {
      id: "total_students",
      label: "Total Students",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      autoFetchKey: "students" as const,
      liveValue: liveCounts?.students,
    },
    {
      id: "total_staff",
      label: "Total Staff",
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      autoFetchKey: "staff" as const,
      liveValue: liveCounts?.staff,
    },
    {
      id: "total_departments",
      label: "Total Departments",
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      autoFetchKey: "departments" as const,
      liveValue: liveCounts?.departments,
    },
    {
      id: "total_courses",
      label: "Total Courses",
      icon: GraduationCap,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      autoFetchKey: "courses" as const,
      liveValue: liveCounts?.courses,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Quick Stats</h3>
          <p className="text-sm text-gray-600 mt-1">Key statistics about your institution</p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Auto-Fetchable Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsItems.map((item) => {
          const Icon = item.icon;
          const fieldValue = formData[item.id as keyof typeof formData];
          const isAutoFetch = autoFetch[item.autoFetchKey];
          
          return (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    {item.label}
                  </CardTitle>
                  {isEditing && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`auto-${item.id}`} className="text-xs text-gray-600">Auto</Label>
                      <Switch
                        id={`auto-${item.id}`}
                        checked={isAutoFetch}
                        onCheckedChange={(checked) =>
                          setAutoFetch({ ...autoFetch, [item.autoFetchKey]: checked })
                        }
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Input
                    type="number"
                    value={fieldValue}
                    onChange={(e) => setFormData({ ...formData, [item.id]: e.target.value })}
                    disabled={!isEditing || isAutoFetch}
                    placeholder="Enter count"
                    className="text-2xl font-bold h-12"
                  />
                  {isEditing && isAutoFetch && item.liveValue !== undefined && (
                    <p className="text-xs text-green-600">
                      ✓ Auto-fetching from database: {item.liveValue}
                    </p>
                  )}
                  {isEditing && !isAutoFetch && (
                    <p className="text-xs text-gray-500">
                      Manual entry mode
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Manual Entry Only Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-indigo-600" />
              </div>
              Campus Area
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              value={formData.campus_area}
              onChange={(e) => setFormData({ ...formData, campus_area: e.target.value })}
              disabled={!isEditing}
              placeholder="e.g., 50 acres / 20 hectares"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              Recognition & Accreditations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={formData.accreditations}
              onChange={(e) => setFormData({ ...formData, accreditations: e.target.value })}
              disabled={!isEditing}
              placeholder="e.g., NAAC A+ Grade, UGC Recognized, ISO 9001:2015 Certified"
              rows={3}
            />
            <p className="text-xs text-gray-500">
              List all major accreditations and recognitions (comma separated)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Preview */}
      {!isEditing && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Stats at a Glance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-blue-600">{formData.total_students || "—"}</p>
                <p className="text-xs text-gray-600 mt-1">Students</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{formData.total_staff || "—"}</p>
                <p className="text-xs text-gray-600 mt-1">Staff</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600">{formData.total_departments || "—"}</p>
                <p className="text-xs text-gray-600 mt-1">Departments</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-600">{formData.total_courses || "—"}</p>
                <p className="text-xs text-gray-600 mt-1">Courses</p>
              </div>
            </div>
            {formData.campus_area && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Campus:</span> {formData.campus_area}
                </p>
              </div>
            )}
            {formData.accreditations && (
              <div className="mt-2">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Accreditations:</span> {formData.accreditations}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {statsData && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(statsData.updated_at || Date.now()).toLocaleString()}
        </div>
      )}
    </div>
  );
}
