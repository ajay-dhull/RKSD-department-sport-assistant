import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Edit, Save, TreePine, Sun, Shield, AlertTriangle, Building2, Droplets } from "lucide-react";

interface CampusEnvironmentSectionProps {
  data: any;
  onUpdate: () => void;
}

export function CampusEnvironmentSection({ data, onUpdate }: CampusEnvironmentSectionProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    total_area: "11.52 acres of land",
    built_up_area: "11,701 sq. m",
    green_area: "34,918 sq. m",
    total_classrooms: "103 classrooms",
    departmental_offices: "17 departmental offices",
    infrastructure_blocks: "Separate blocks for Arts, Science, Commerce, and Postgraduate departments",
    main_building_description: "The iconic main building reflects the college's rich heritage and academic excellence since its inception.",
    pg_block_description: "A two-storey Postgraduate Block was added in 2004 during the college's Diamond Jubilee year.",
    smart_classrooms: "In 2018, a modern extension was constructed with 30 smart rooms to facilitate ICT-based teaching.",
    sports_infrastructure: "A large indoor and outdoor stadium within the campus supports various athletic and fitness activities.",
    
    solar_power_plants: "Two solar installations (120 KVA and 43 KVA) reduce the college's carbon footprint and support clean energy goals — the second was funded under the RUSA 2.0 grant.",
    water_conservation: "Rainwater harvesting systems divert run-off to recharge borewells and prevent flooding during heavy rains.",
    plantation_drives: "The Eco Club, NCC and NSS volunteers organize plantation and environment-awareness campaigns regularly.",
    waste_management: "The college follows the 'Reduce, Reuse, Recycle' policy and has dustbins at regular intervals across campus.",
    eco_friendly_campus: "RKSD College maintains a clean, green, plastic-free, and tobacco-free environment.",
    
    security_247: "A professional security agency monitors the campus round the clock.",
    cctv_surveillance: "Over 70 CCTV cameras cover key locations including classrooms, corridors, and entry points.",
    female_entrance: "A dedicated entry and security checkpoint ensure female safety and comfort.",
    identity_regulations: "Entry without college ID is restricted; ragging is strictly prohibited; parking is allowed only in designated zones.",
    
    medical_assistance: "A dispensary and first-aid center are available for students and staff on campus.",
    emergency_support: "Tied arrangements exist with nearby hospitals and nursing homes for urgent medical care.",
    welfare_schemes: "Staff benefit from emergency advance schemes for critical needs.",
    green_audit: "The college has successfully completed a comprehensive Environmental and Green Campus Audit certification.",
    fire_safety: "Basic fire extinguishers and emergency procedures are in place as per institutional safety norms.",
  });

  const [isEditing, setIsEditing] = useState(false);

  const { data: campusData } = useQuery({
    queryKey: ["/api/admin/general-info/campus-environment"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/campus-environment", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (campusData) {
      setFormData({
        total_area: campusData.total_area || formData.total_area,
        built_up_area: campusData.built_up_area || formData.built_up_area,
        green_area: campusData.green_area || formData.green_area,
        total_classrooms: campusData.total_classrooms || formData.total_classrooms,
        departmental_offices: campusData.departmental_offices || formData.departmental_offices,
        infrastructure_blocks: campusData.infrastructure_blocks || formData.infrastructure_blocks,
        main_building_description: campusData.main_building_description || formData.main_building_description,
        pg_block_description: campusData.pg_block_description || formData.pg_block_description,
        smart_classrooms: campusData.smart_classrooms || formData.smart_classrooms,
        sports_infrastructure: campusData.sports_infrastructure || formData.sports_infrastructure,
        solar_power_plants: campusData.solar_power_plants || formData.solar_power_plants,
        water_conservation: campusData.water_conservation || formData.water_conservation,
        plantation_drives: campusData.plantation_drives || formData.plantation_drives,
        waste_management: campusData.waste_management || formData.waste_management,
        eco_friendly_campus: campusData.eco_friendly_campus || formData.eco_friendly_campus,
        security_247: campusData.security_247 || formData.security_247,
        cctv_surveillance: campusData.cctv_surveillance || formData.cctv_surveillance,
        female_entrance: campusData.female_entrance || formData.female_entrance,
        identity_regulations: campusData.identity_regulations || formData.identity_regulations,
        medical_assistance: campusData.medical_assistance || formData.medical_assistance,
        emergency_support: campusData.emergency_support || formData.emergency_support,
        welfare_schemes: campusData.welfare_schemes || formData.welfare_schemes,
        green_audit: campusData.green_audit || formData.green_audit,
        fire_safety: campusData.fire_safety || formData.fire_safety,
      });
    }
  }, [campusData]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin/general-info/campus-environment", {
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
      toast({ title: "Success", description: "Campus & Environment information updated successfully" });
      setIsEditing(false);
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Campus & Environment</h2>
          <p className="text-sm text-gray-600">Manage campus area, green initiatives, safety and emergency measures</p>
        </div>
        <Button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={saveMutation.isPending}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </div>

      {/* Campus Area & Buildings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Campus Area & Buildings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_area">Total Campus Area</Label>
              {isEditing ? (
                <Input
                  id="total_area"
                  value={formData.total_area}
                  onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.total_area}</p>
              )}
            </div>
            <div>
              <Label htmlFor="built_up_area">Built-up Area</Label>
              {isEditing ? (
                <Input
                  id="built_up_area"
                  value={formData.built_up_area}
                  onChange={(e) => setFormData({ ...formData, built_up_area: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.built_up_area}</p>
              )}
            </div>
            <div>
              <Label htmlFor="green_area">Green Area</Label>
              {isEditing ? (
                <Input
                  id="green_area"
                  value={formData.green_area}
                  onChange={(e) => setFormData({ ...formData, green_area: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.green_area}</p>
              )}
            </div>
            <div>
              <Label htmlFor="total_classrooms">Total Classrooms</Label>
              {isEditing ? (
                <Input
                  id="total_classrooms"
                  value={formData.total_classrooms}
                  onChange={(e) => setFormData({ ...formData, total_classrooms: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.total_classrooms}</p>
              )}
            </div>
            <div>
              <Label htmlFor="departmental_offices">Departmental Offices</Label>
              {isEditing ? (
                <Input
                  id="departmental_offices"
                  value={formData.departmental_offices}
                  onChange={(e) => setFormData({ ...formData, departmental_offices: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.departmental_offices}</p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="infrastructure_blocks">Infrastructure Blocks</Label>
            {isEditing ? (
              <Textarea
                id="infrastructure_blocks"
                value={formData.infrastructure_blocks}
                onChange={(e) => setFormData({ ...formData, infrastructure_blocks: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.infrastructure_blocks}</p>
            )}
          </div>

          <div>
            <Label htmlFor="main_building_description">Main Building</Label>
            {isEditing ? (
              <Textarea
                id="main_building_description"
                value={formData.main_building_description}
                onChange={(e) => setFormData({ ...formData, main_building_description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.main_building_description}</p>
            )}
          </div>

          <div>
            <Label htmlFor="pg_block_description">PG Block</Label>
            {isEditing ? (
              <Textarea
                id="pg_block_description"
                value={formData.pg_block_description}
                onChange={(e) => setFormData({ ...formData, pg_block_description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.pg_block_description}</p>
            )}
          </div>

          <div>
            <Label htmlFor="smart_classrooms">Smart Classrooms</Label>
            {isEditing ? (
              <Textarea
                id="smart_classrooms"
                value={formData.smart_classrooms}
                onChange={(e) => setFormData({ ...formData, smart_classrooms: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.smart_classrooms}</p>
            )}
          </div>

          <div>
            <Label htmlFor="sports_infrastructure">Sports Infrastructure</Label>
            {isEditing ? (
              <Textarea
                id="sports_infrastructure"
                value={formData.sports_infrastructure}
                onChange={(e) => setFormData({ ...formData, sports_infrastructure: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.sports_infrastructure}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Green Initiatives & Sustainability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreePine className="h-5 w-5 text-green-600" />
            Green Initiatives & Sustainability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="solar_power_plants">
              <Sun className="inline h-4 w-4 mr-1 text-yellow-600" />
              Solar Power Plants
            </Label>
            {isEditing ? (
              <Textarea
                id="solar_power_plants"
                value={formData.solar_power_plants}
                onChange={(e) => setFormData({ ...formData, solar_power_plants: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.solar_power_plants}</p>
            )}
          </div>

          <div>
            <Label htmlFor="water_conservation">
              <Droplets className="inline h-4 w-4 mr-1 text-blue-600" />
              Water Conservation
            </Label>
            {isEditing ? (
              <Textarea
                id="water_conservation"
                value={formData.water_conservation}
                onChange={(e) => setFormData({ ...formData, water_conservation: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.water_conservation}</p>
            )}
          </div>

          <div>
            <Label htmlFor="plantation_drives">Plantation Drives & Eco Club</Label>
            {isEditing ? (
              <Textarea
                id="plantation_drives"
                value={formData.plantation_drives}
                onChange={(e) => setFormData({ ...formData, plantation_drives: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.plantation_drives}</p>
            )}
          </div>

          <div>
            <Label htmlFor="waste_management">Waste Management</Label>
            {isEditing ? (
              <Textarea
                id="waste_management"
                value={formData.waste_management}
                onChange={(e) => setFormData({ ...formData, waste_management: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.waste_management}</p>
            )}
          </div>

          <div>
            <Label htmlFor="eco_friendly_campus">Eco-Friendly Campus</Label>
            {isEditing ? (
              <Textarea
                id="eco_friendly_campus"
                value={formData.eco_friendly_campus}
                onChange={(e) => setFormData({ ...formData, eco_friendly_campus: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.eco_friendly_campus}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Safety & Security Measures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Safety & Security Measures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="security_247">24/7 Security</Label>
            {isEditing ? (
              <Textarea
                id="security_247"
                value={formData.security_247}
                onChange={(e) => setFormData({ ...formData, security_247: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.security_247}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cctv_surveillance">CCTV Surveillance</Label>
            {isEditing ? (
              <Textarea
                id="cctv_surveillance"
                value={formData.cctv_surveillance}
                onChange={(e) => setFormData({ ...formData, cctv_surveillance: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.cctv_surveillance}</p>
            )}
          </div>

          <div>
            <Label htmlFor="female_entrance">Separate Entrance for Female Students</Label>
            {isEditing ? (
              <Textarea
                id="female_entrance"
                value={formData.female_entrance}
                onChange={(e) => setFormData({ ...formData, female_entrance: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.female_entrance}</p>
            )}
          </div>

          <div>
            <Label htmlFor="identity_regulations">Identity & Regulations</Label>
            {isEditing ? (
              <Textarea
                id="identity_regulations"
                value={formData.identity_regulations}
                onChange={(e) => setFormData({ ...formData, identity_regulations: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.identity_regulations}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fire & Emergency Preparedness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Fire & Emergency Preparedness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="medical_assistance">Medical Assistance</Label>
            {isEditing ? (
              <Textarea
                id="medical_assistance"
                value={formData.medical_assistance}
                onChange={(e) => setFormData({ ...formData, medical_assistance: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.medical_assistance}</p>
            )}
          </div>

          <div>
            <Label htmlFor="emergency_support">Emergency Support</Label>
            {isEditing ? (
              <Textarea
                id="emergency_support"
                value={formData.emergency_support}
                onChange={(e) => setFormData({ ...formData, emergency_support: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.emergency_support}</p>
            )}
          </div>

          <div>
            <Label htmlFor="welfare_schemes">Welfare Schemes</Label>
            {isEditing ? (
              <Textarea
                id="welfare_schemes"
                value={formData.welfare_schemes}
                onChange={(e) => setFormData({ ...formData, welfare_schemes: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.welfare_schemes}</p>
            )}
          </div>

          <div>
            <Label htmlFor="green_audit">Environment & Green Audit</Label>
            {isEditing ? (
              <Textarea
                id="green_audit"
                value={formData.green_audit}
                onChange={(e) => setFormData({ ...formData, green_audit: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.green_audit}</p>
            )}
          </div>

          <div>
            <Label htmlFor="fire_safety">Fire Safety</Label>
            {isEditing ? (
              <Textarea
                id="fire_safety"
                value={formData.fire_safety}
                onChange={(e) => setFormData({ ...formData, fire_safety: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.fire_safety}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
