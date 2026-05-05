import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Edit, MapPin, Phone, Mail, Globe, Clock, Building2, Award } from "lucide-react";

interface BasicDetailsSectionProps {
  data: any;
  onUpdate: () => void;
}

export function BasicDetailsSection({ data, onUpdate }: BasicDetailsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    // Part 1: Basic College Details - COMPLETE DATA
    college_full_name: "Radha Krishan Sanatan Dharm (PG) College, Kaithal",
    college_short_name: "RKSD (PG) College",
    college_code: "",
    motto: "Learning Today, Leading Tomorrow",
    mission_statement: "To impart education with a futuristic vision; to improve quality of lives through education; to facilitate transition towards a digital society; to strengthen interface with dynamics of agriculture, industry and emerging needs of community.",
    established_year: "1954",
    college_type: "Private and Government-Aided (Managed by Rashtriya Vidya Samiti (Regd.), Kaithal)",
    affiliated_university: "Kurukshetra University, Kurukshetra",
    accreditation_naac: "NAAC: Accredited with 'A' Grade in session 2016-17",
    accreditation_ugc: "UGC: Recognized under Sections 2(f) & 12(b) of UGC Act",
    principal_name: "Dr. Rajbir Parashar",
    principal_tenure_start: "2025-08-01",
    principal_predecessor: "Dr. Satyabir Singh Mehla",
    logo_description: "Shield emblem depicting a lotus, a lamp (diya), books, and a rising sun, encircled by the words 'Radha Krishan Sanatan Dharm College, Kaithal.'",
    
    // Part 2: Address & Contact Information - COMPLETE DATA
    address_full: "Ambala Road, Chiranjeev Colony, Kaithal, Haryana, 136027, India",
    google_map_link: "",
    phone_office: "01746-222368",
    phone_helpdesk: "9812018462",
    phone_alternate: "",
    email_general: "principal@rksdcollege.ac.in",
    email_principal: "principal@rksdcollege.ac.in",
    email_alternate: "rksdcollegektl@yahoo.com",
    email_evening_college: "rksdeveningcollege@gmail.com",
    website_url: "https://rksdcollege.ac.in/",
    office_timings: "09:00 AM – 05:00 PM (Mon-Sat)",
  });

  const [isEditing, setIsEditing] = useState(false);

  const { data: basicDetails } = useQuery({
    queryKey: ["/api/admin/general-info/basic-details"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/basic-details", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (basicDetails) {
      setFormData({
        college_full_name: basicDetails.college_full_name || "Radha Krishan Sanatan Dharm (PG) College, Kaithal",
        college_short_name: basicDetails.college_short_name || "RKSD (PG) College",
        college_code: basicDetails.college_code || "",
        motto: basicDetails.motto || "Learning Today, Leading Tomorrow",
        mission_statement: basicDetails.mission_statement || "To impart education with a futuristic vision; to improve quality of lives through education; to facilitate transition towards a digital society; to strengthen interface with dynamics of agriculture, industry and emerging needs of community.",
        established_year: basicDetails.established_year || "1954",
        college_type: basicDetails.college_type || "Private and Government-Aided (Managed by Rashtriya Vidya Samiti (Regd.), Kaithal)",
        affiliated_university: basicDetails.affiliated_university || "Kurukshetra University, Kurukshetra",
        accreditation_naac: basicDetails.accreditation_naac || "NAAC: Accredited with 'A' Grade in session 2016-17",
        accreditation_ugc: basicDetails.accreditation_ugc || "UGC: Recognized under Sections 2(f) & 12(b) of UGC Act",
        principal_name: basicDetails.principal_name || "Dr. Rajbir Parashar",
        principal_tenure_start: basicDetails.principal_tenure_start || "2025-08-01",
        principal_predecessor: basicDetails.principal_predecessor || "Dr. Satyabir Singh Mehla",
        logo_description: basicDetails.logo_description || "Shield emblem depicting a lotus, a lamp (diya), books, and a rising sun, encircled by the words 'Radha Krishan Sanatan Dharm College, Kaithal.'",
        address_full: basicDetails.address_full || "Ambala Road, Chiranjeev Colony, Kaithal, Haryana, 136027, India",
        google_map_link: basicDetails.google_map_link || "",
        phone_office: basicDetails.phone_office || "01746-222368",
        phone_helpdesk: basicDetails.phone_helpdesk || "9812018462",
        phone_alternate: basicDetails.phone_alternate || "",
        email_general: basicDetails.email_general || "principal@rksdcollege.ac.in",
        email_principal: basicDetails.email_principal || "principal@rksdcollege.ac.in",
        email_alternate: basicDetails.email_alternate || "rksdcollegektl@yahoo.com",
        email_evening_college: basicDetails.email_evening_college || "rksdeveningcollege@gmail.com",
        website_url: basicDetails.website_url || "https://rksdcollege.ac.in/",
        office_timings: basicDetails.office_timings || "09:00 AM – 05:00 PM (Mon-Sat)",
      });
    }
  }, [basicDetails]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/general-info/basic-details", {
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
      toast({ title: "Success", description: "Basic details updated successfully" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info/basic-details"] });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Complete College Information</h3>
          <p className="text-sm text-gray-600 mt-1">All fundamental details about the institution</p>
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
              {saveMutation.isPending ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Part 1: Basic College Details */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Part 1: Basic College Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="college_full_name">College Full Name *</Label>
              <Input
                id="college_full_name"
                value={formData.college_full_name}
                onChange={(e) => handleChange("college_full_name", e.target.value)}
                disabled={!isEditing}
                placeholder="Radha Krishan Sanatan Dharm (PG) College, Kaithal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college_short_name">Short Name / Code</Label>
              <Input
                id="college_short_name"
                value={formData.college_short_name}
                onChange={(e) => handleChange("college_short_name", e.target.value)}
                disabled={!isEditing}
                placeholder="RKSD (PG) College"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college_code">College Code / ID</Label>
              <Input
                id="college_code"
                value={formData.college_code}
                onChange={(e) => handleChange("college_code", e.target.value)}
                disabled={!isEditing}
                placeholder="Internal administrative number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="established_year">Established Year *</Label>
              <Input
                id="established_year"
                type="number"
                value={formData.established_year}
                onChange={(e) => handleChange("established_year", e.target.value)}
                disabled={!isEditing}
                placeholder="1954"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="motto">Motto / Tagline</Label>
              <Input
                id="motto"
                value={formData.motto}
                onChange={(e) => handleChange("motto", e.target.value)}
                disabled={!isEditing}
                placeholder="Learning Today, Leading Tomorrow"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mission_statement">Mission Statement *</Label>
              <Textarea
                id="mission_statement"
                value={formData.mission_statement}
                onChange={(e) => handleChange("mission_statement", e.target.value)}
                disabled={!isEditing}
                placeholder="To impart education with a futuristic vision..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college_type">College Type *</Label>
              <Input
                id="college_type"
                value={formData.college_type}
                onChange={(e) => handleChange("college_type", e.target.value)}
                disabled={!isEditing}
                placeholder="Government / Private / Autonomous / Government-Aided"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="affiliated_university">Affiliated University *</Label>
              <Input
                id="affiliated_university"
                value={formData.affiliated_university}
                onChange={(e) => handleChange("affiliated_university", e.target.value)}
                disabled={!isEditing}
                placeholder="Kurukshetra University, Kurukshetra"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accreditation_naac">NAAC Accreditation</Label>
              <Input
                id="accreditation_naac"
                value={formData.accreditation_naac}
                onChange={(e) => handleChange("accreditation_naac", e.target.value)}
                disabled={!isEditing}
                placeholder="Accredited with 'A' Grade in session 2016-17"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accreditation_ugc">UGC Recognition</Label>
              <Input
                id="accreditation_ugc"
                value={formData.accreditation_ugc}
                onChange={(e) => handleChange("accreditation_ugc", e.target.value)}
                disabled={!isEditing}
                placeholder="Recognized under Sections 2(f) & 12(b) of UGC Act"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="principal_name">Current Principal Name *</Label>
              <Input
                id="principal_name"
                value={formData.principal_name}
                onChange={(e) => handleChange("principal_name", e.target.value)}
                disabled={!isEditing}
                placeholder="Dr. Rajbir Parashar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="principal_tenure_start">Principal Tenure Start Date</Label>
              <Input
                id="principal_tenure_start"
                type="date"
                value={formData.principal_tenure_start}
                onChange={(e) => handleChange("principal_tenure_start", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="principal_predecessor">Previous Principal</Label>
              <Input
                id="principal_predecessor"
                value={formData.principal_predecessor}
                onChange={(e) => handleChange("principal_predecessor", e.target.value)}
                disabled={!isEditing}
                placeholder="Dr. Satyabir Singh Mehla"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logo_description">Official Logo / Emblem Description</Label>
              <Textarea
                id="logo_description"
                value={formData.logo_description}
                onChange={(e) => handleChange("logo_description", e.target.value)}
                disabled={!isEditing}
                placeholder="Shield emblem depicting a lotus, a lamp (diya), books, and a rising sun..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Part 2: Address & Contact Information */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Part 2: Address & Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address_full">Full Address *</Label>
              <Textarea
                id="address_full"
                value={formData.address_full}
                onChange={(e) => handleChange("address_full", e.target.value)}
                disabled={!isEditing}
                placeholder="Ambala Road, Chiranjeev Colony, Kaithal, Haryana, 136027, India"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_office">Phone - Office / Main *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone_office"
                  value={formData.phone_office}
                  onChange={(e) => handleChange("phone_office", e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="01746-222368"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_helpdesk">Phone - Helpdesk / Admission</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone_helpdesk"
                  value={formData.phone_helpdesk}
                  onChange={(e) => handleChange("phone_helpdesk", e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="9812018462"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_alternate">Phone - Alternate</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone_alternate"
                  value={formData.phone_alternate}
                  onChange={(e) => handleChange("phone_alternate", e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="Additional phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_general">Email - General / Office *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email_general"
                  type="email"
                  value={formData.email_general}
                  onChange={(e) => handleChange("email_general", e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="principal@rksdcollege.ac.in"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_principal">Email - Principal</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email_principal"
                  type="email"
                  value={formData.email_principal}
                  onChange={(e) => handleChange("email_principal", e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="principal@rksdcollege.ac.in"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_alternate">Email - Alternate</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email_alternate"
                  type="email"
                  value={formData.email_alternate}
                  onChange={(e) => handleChange("email_alternate", e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="rksdcollegektl@yahoo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_evening_college">Email - Evening College</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email_evening_college"
                  type="email"
                  value={formData.email_evening_college}
                  onChange={(e) => handleChange("email_evening_college", e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="rksdeveningcollege@gmail.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Official Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => handleChange("website_url", e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="https://rksdcollege.ac.in/"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="office_timings">Office Timings</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="office_timings"
                  value={formData.office_timings}
                  onChange={(e) => handleChange("office_timings", e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="09:00 AM – 05:00 PM (Mon-Sat)"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="google_map_link">Google Map Embed Link</Label>
              <Input
                id="google_map_link"
                value={formData.google_map_link}
                onChange={(e) => handleChange("google_map_link", e.target.value)}
                disabled={!isEditing}
                placeholder="Paste Google Maps embed iframe src URL"
              />
              <p className="text-xs text-gray-500">
                To get embed link: Open Google Maps → Search your college → Click "Share" → Click "Embed a map" → Copy the iframe src URL
              </p>
            </div>
            
            {formData.google_map_link && (
              <div className="md:col-span-2">
                <div className="aspect-video w-full rounded-lg overflow-hidden border">
                  <iframe
                    src={formData.google_map_link}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {basicDetails && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(basicDetails.updated_at || Date.now()).toLocaleString()}
        </div>
      )}
    </div>
  );
}
