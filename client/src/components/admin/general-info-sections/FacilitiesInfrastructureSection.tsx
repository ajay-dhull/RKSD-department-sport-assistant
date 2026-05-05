import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Save, Building, BookOpen, Dumbbell, Home, Utensils, Heart, Bus, Users, Wifi, Camera, Leaf, Sun } from "lucide-react";

interface FacilitiesInfrastructureSectionProps {
  data: any;
  onUpdate: () => void;
}

export function FacilitiesInfrastructureSection({ data, onUpdate }: FacilitiesInfrastructureSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    library_collection: "Central, air-conditioned library with 50,882 books covering course curriculum & general interest; subscribes to national & international periodicals, journals, magazines and newspapers.",
    library_digital_access: "Internet access, e-resources (NLIST/NDL style access implied) and an Online Public Access Catalogue (OPAC) / search portal is available. (Library web + ERP OPAC).",
    library_facilities_seating: "Three air-conditioned reading halls; total reading seating ~400; reprography (photocopy) & book-bank facilities; extended hours during exams (regular circulation 9:00 AM–4:00 PM; reading hall 8:00 AM–5:00 PM — typically).",
    
    labs_total: "19 well-equipped laboratories across departments (Zoology, Mathematics, Chemistry, Computer, Geography, Physics, etc.).",
    labs_special: "Includes a language lab and departmental labs for practicals and research.",
    
    sports_outdoor: "Large stadium with 8-lane grassy athletic track, football ground, cricket pitches/practice nets, volleyball courts, basketball courts (with floodlights), lawn tennis court, plus courts for Kho-Kho, Kabaddi, Handball, Netball.",
    sports_indoor: "Indoor stadium-cum-sports complex for table-tennis, badminton, boxing, wrestling, judo, taekwondo and a multi-gym hall.",
    sports_special: "Semi-Olympic swimming pool and an international-standard 10-meter shooting range are listed on official pages. College runs trainers/coaches for certain activities.",
    
    hostel_status: "No regular hostel facility for students is indicated in the college prospectus and official documentation; earlier third-party listings claiming hostels appear to be outdated/conflicting. (College prospectus / official PDF shows residential building only for limited staff/class-IV employees). So: Hostels — NOT available (verify with college office for any new changes).",
    
    canteen_description: "Two separate canteens (boys & girls) plus a spacious cafeteria; food quality monitored by a faculty committee; hygiene policies enforced.",
    
    medical_dispensary: "On-campus dispensary supervised by a visiting doctor; first-aid available. College has tie-ups with nearby hospitals for emergencies.",
    
    transport_local: "College sits on Ambala Road — well-connected by public transport.",
    transport_dedicated: "No clear evidence of a college-owned bus fleet in official documents — third-party claims vary. (Recommend confirming with admin if you want to list college buses).",
    
    auditorium_description: "Partially air-conditioned, sound-proof auditorium with ~500 seating capacity and AV setup.",
    seminar_halls: "7 seminar halls, plus 1 conference room and 1 committee room for meetings/events.",
    
    wifi_internet: "Campus-wide free Wi-Fi access; internet provision via a leased line (noted as 4 Mbps in some sources).",
    smart_classrooms: "103 Wi-Fi enabled classrooms including 13 smart classrooms equipped with modern ICT tools.",
    computer_labs: "Two fully air-conditioned computer labs with up-to-date systems & software (used for teaching and practicals).",
    
    security_staff: "Round-the-clock security provided by a contracted agency.",
    cctv_coverage: "~70 CCTV cameras installed at strategic locations across campus; public address system also noted.",
    
    green_campus: "Well-groomed lawns, aesthetic plantation & cleanliness drives; polythene ban and dustbins placed around campus.",
    solar_power: "Solar power plant (120 KVA) installed (2018-19) to reduce carbon footprint; an additional ~43 KVA (RUSA grant) was planned/under installation in official documents (total ~163 KVA when both active). (Official phrasing: 120 KVA installed; another 43 KVA approved/going to be installed).",
    water_management: "Artificial groundwater recharge systems and rainwater management measures are mentioned in college reports.",
    
    additional_facilities: "Guest House / Waiting Room for visiting faculty & student family members. Multi-gym hall with equipment and trainers.",
    
    verification_notes: "Hostel: Official prospectus shows no student hostel. If you plan to publish \"Hostel: No\" on the site, that is accurate per prospectus; confirm with admin for any 2025-26 update. Transport fleet & exact leased line bandwidth: tertiary sources give varied values — confirm with college admin if you need precise bus count or current internet Mbps.",
  });

  const [isEditing, setIsEditing] = useState(false);

  const { data: facilitiesData } = useQuery({
    queryKey: ["/api/admin/general-info/facilities-infrastructure"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/facilities-infrastructure", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (facilitiesData) {
      setFormData({
        library_collection: facilitiesData.library_collection || formData.library_collection,
        library_digital_access: facilitiesData.library_digital_access || formData.library_digital_access,
        library_facilities_seating: facilitiesData.library_facilities_seating || formData.library_facilities_seating,
        labs_total: facilitiesData.labs_total || formData.labs_total,
        labs_special: facilitiesData.labs_special || formData.labs_special,
        sports_outdoor: facilitiesData.sports_outdoor || formData.sports_outdoor,
        sports_indoor: facilitiesData.sports_indoor || formData.sports_indoor,
        sports_special: facilitiesData.sports_special || formData.sports_special,
        hostel_status: facilitiesData.hostel_status || formData.hostel_status,
        canteen_description: facilitiesData.canteen_description || formData.canteen_description,
        medical_dispensary: facilitiesData.medical_dispensary || formData.medical_dispensary,
        transport_local: facilitiesData.transport_local || formData.transport_local,
        transport_dedicated: facilitiesData.transport_dedicated || formData.transport_dedicated,
        auditorium_description: facilitiesData.auditorium_description || formData.auditorium_description,
        seminar_halls: facilitiesData.seminar_halls || formData.seminar_halls,
        wifi_internet: facilitiesData.wifi_internet || formData.wifi_internet,
        smart_classrooms: facilitiesData.smart_classrooms || formData.smart_classrooms,
        computer_labs: facilitiesData.computer_labs || formData.computer_labs,
        security_staff: facilitiesData.security_staff || formData.security_staff,
        cctv_coverage: facilitiesData.cctv_coverage || formData.cctv_coverage,
        green_campus: facilitiesData.green_campus || formData.green_campus,
        solar_power: facilitiesData.solar_power || formData.solar_power,
        water_management: facilitiesData.water_management || formData.water_management,
        additional_facilities: facilitiesData.additional_facilities || formData.additional_facilities,
        verification_notes: facilitiesData.verification_notes || formData.verification_notes,
      });
    }
  }, [facilitiesData]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin/general-info/facilities-infrastructure", {
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
      toast({ title: "Success", description: "Facilities & Infrastructure information updated successfully" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info/facilities-infrastructure"] });
      onUpdate();
    },
    onError: (error: any) => {
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
          <h2 className="text-2xl font-bold">Facilities & Infrastructure</h2>
          <p className="text-sm text-gray-600">Manage college facilities and infrastructure details</p>
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

      {/* Library Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Library
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="library_collection">Collection</Label>
            {isEditing ? (
              <Textarea
                id="library_collection"
                value={formData.library_collection}
                onChange={(e) => setFormData({ ...formData, library_collection: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.library_collection}</p>
            )}
          </div>
          <div>
            <Label htmlFor="library_digital_access">Digital Access / OPAC</Label>
            {isEditing ? (
              <Textarea
                id="library_digital_access"
                value={formData.library_digital_access}
                onChange={(e) => setFormData({ ...formData, library_digital_access: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.library_digital_access}</p>
            )}
          </div>
          <div>
            <Label htmlFor="library_facilities_seating">Facilities & Seating</Label>
            {isEditing ? (
              <Textarea
                id="library_facilities_seating"
                value={formData.library_facilities_seating}
                onChange={(e) => setFormData({ ...formData, library_facilities_seating: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.library_facilities_seating}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Laboratories Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-purple-600" />
            Laboratories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="labs_total">Total Labs</Label>
            {isEditing ? (
              <Textarea
                id="labs_total"
                value={formData.labs_total}
                onChange={(e) => setFormData({ ...formData, labs_total: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.labs_total}</p>
            )}
          </div>
          <div>
            <Label htmlFor="labs_special">Special Labs</Label>
            {isEditing ? (
              <Textarea
                id="labs_special"
                value={formData.labs_special}
                onChange={(e) => setFormData({ ...formData, labs_special: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.labs_special}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sports Facilities Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-green-600" />
            Sports Facilities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sports_outdoor">Outdoor</Label>
            {isEditing ? (
              <Textarea
                id="sports_outdoor"
                value={formData.sports_outdoor}
                onChange={(e) => setFormData({ ...formData, sports_outdoor: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.sports_outdoor}</p>
            )}
          </div>
          <div>
            <Label htmlFor="sports_indoor">Indoor / Complex</Label>
            {isEditing ? (
              <Textarea
                id="sports_indoor"
                value={formData.sports_indoor}
                onChange={(e) => setFormData({ ...formData, sports_indoor: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.sports_indoor}</p>
            )}
          </div>
          <div>
            <Label htmlFor="sports_special">Special Facilities</Label>
            {isEditing ? (
              <Textarea
                id="sports_special"
                value={formData.sports_special}
                onChange={(e) => setFormData({ ...formData, sports_special: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.sports_special}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hostel / Accommodation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-indigo-600" />
            Hostel / Accommodation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="hostel_status">Current Status</Label>
            {isEditing ? (
              <Textarea
                id="hostel_status"
                value={formData.hostel_status}
                onChange={(e) => setFormData({ ...formData, hostel_status: e.target.value })}
                rows={4}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.hostel_status}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Canteen / Cafeteria Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-600" />
            Canteen / Cafeteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="canteen_description">Separate Canteens</Label>
            {isEditing ? (
              <Textarea
                id="canteen_description"
                value={formData.canteen_description}
                onChange={(e) => setFormData({ ...formData, canteen_description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.canteen_description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medical / Health Centre Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600" />
            Medical / Health Centre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="medical_dispensary">Functional Dispensary</Label>
            {isEditing ? (
              <Textarea
                id="medical_dispensary"
                value={formData.medical_dispensary}
                onChange={(e) => setFormData({ ...formData, medical_dispensary: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.medical_dispensary}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transport & Local Access Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5 text-blue-600" />
            Transport & Local Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="transport_local">Local Connectivity</Label>
            {isEditing ? (
              <Textarea
                id="transport_local"
                value={formData.transport_local}
                onChange={(e) => setFormData({ ...formData, transport_local: e.target.value })}
                rows={1}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.transport_local}</p>
            )}
          </div>
          <div>
            <Label htmlFor="transport_dedicated">Dedicated Transport</Label>
            {isEditing ? (
              <Textarea
                id="transport_dedicated"
                value={formData.transport_dedicated}
                onChange={(e) => setFormData({ ...formData, transport_dedicated: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.transport_dedicated}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auditorium / Seminar Halls Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Auditorium / Seminar Halls / Conference Rooms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="auditorium_description">Auditorium</Label>
            {isEditing ? (
              <Textarea
                id="auditorium_description"
                value={formData.auditorium_description}
                onChange={(e) => setFormData({ ...formData, auditorium_description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.auditorium_description}</p>
            )}
          </div>
          <div>
            <Label htmlFor="seminar_halls">Seminar Halls</Label>
            {isEditing ? (
              <Textarea
                id="seminar_halls"
                value={formData.seminar_halls}
                onChange={(e) => setFormData({ ...formData, seminar_halls: e.target.value })}
                rows={1}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.seminar_halls}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wi-Fi / Internet / IT Labs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-cyan-600" />
            Wi-Fi / Internet / IT Labs / Smart Classrooms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="wifi_internet">Campus Wi-Fi</Label>
            {isEditing ? (
              <Textarea
                id="wifi_internet"
                value={formData.wifi_internet}
                onChange={(e) => setFormData({ ...formData, wifi_internet: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.wifi_internet}</p>
            )}
          </div>
          <div>
            <Label htmlFor="smart_classrooms">Smart Classrooms</Label>
            {isEditing ? (
              <Textarea
                id="smart_classrooms"
                value={formData.smart_classrooms}
                onChange={(e) => setFormData({ ...formData, smart_classrooms: e.target.value })}
                rows={1}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.smart_classrooms}</p>
            )}
          </div>
          <div>
            <Label htmlFor="computer_labs">Computer Labs</Label>
            {isEditing ? (
              <Textarea
                id="computer_labs"
                value={formData.computer_labs}
                onChange={(e) => setFormData({ ...formData, computer_labs: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.computer_labs}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campus Security / CCTV Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-gray-600" />
            Campus Security / CCTV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="security_staff">Security Staff</Label>
            {isEditing ? (
              <Textarea
                id="security_staff"
                value={formData.security_staff}
                onChange={(e) => setFormData({ ...formData, security_staff: e.target.value })}
                rows={1}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.security_staff}</p>
            )}
          </div>
          <div>
            <Label htmlFor="cctv_coverage">CCTV Coverage</Label>
            {isEditing ? (
              <Textarea
                id="cctv_coverage"
                value={formData.cctv_coverage}
                onChange={(e) => setFormData({ ...formData, cctv_coverage: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.cctv_coverage}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clean & Green Campus / Sustainability Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            Clean & Green Campus / Sustainability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="green_campus">Green Campus</Label>
            {isEditing ? (
              <Textarea
                id="green_campus"
                value={formData.green_campus}
                onChange={(e) => setFormData({ ...formData, green_campus: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.green_campus}</p>
            )}
          </div>
          <div>
            <Label htmlFor="solar_power">Solar Power</Label>
            {isEditing ? (
              <Textarea
                id="solar_power"
                value={formData.solar_power}
                onChange={(e) => setFormData({ ...formData, solar_power: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.solar_power}</p>
            )}
          </div>
          <div>
            <Label htmlFor="water_management">Water Management</Label>
            {isEditing ? (
              <Textarea
                id="water_management"
                value={formData.water_management}
                onChange={(e) => setFormData({ ...formData, water_management: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.water_management}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional / Miscellaneous Facilities Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-600" />
            Additional / Miscellaneous Facilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="additional_facilities">Other Facilities</Label>
            {isEditing ? (
              <Textarea
                id="additional_facilities"
                value={formData.additional_facilities}
                onChange={(e) => setFormData({ ...formData, additional_facilities: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.additional_facilities}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Notes / Caveats Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-amber-700">Verification Notes / Caveats</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="verification_notes" className="text-xs text-amber-600">Notes</Label>
            {isEditing ? (
              <Textarea
                id="verification_notes"
                value={formData.verification_notes}
                onChange={(e) => setFormData({ ...formData, verification_notes: e.target.value })}
                rows={3}
                className="mt-1 text-xs"
              />
            ) : (
              <p className="text-xs text-amber-700 mt-1 bg-amber-50 p-3 rounded">{formData.verification_notes}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {facilitiesData && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(facilitiesData.updated_at || Date.now()).toLocaleString()}
        </div>
      )}
    </div>
  );
}
