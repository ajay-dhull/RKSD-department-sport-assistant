import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Save, Users, Phone, Award, Shield, UserCheck, Heart, HandHeart, Flag, Activity } from "lucide-react";

interface StudentSupportServicesSectionProps {
  data: any;
  onUpdate: () => void;
}

export function StudentSupportServicesSection({ data, onUpdate }: StudentSupportServicesSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    overview: "RKSD College runs multiple student support structures — Career Guidance & Counseling Cell, Grievance Redressal Cell, Anti-Ragging Committee, Women Cell / Internal Complaints Committee (ICC), SC/ST / Minority Cell, Placement Cell, Alumni Association, plus extension units like NSS / NCC — all aimed at student welfare, protection and employability.",
    
    career_guidance_purpose: "Career planning, pre-placement training, soft-skills workshops, one-to-one counselling and employer connects.",
    career_guidance_activities: "Workshops, panel discussions, placement drives (e.g., collaboration with NIIT for Axis Bank drive, May 31, 2025), mock interviews, resume clinics and campus recruitment facilitation.",
    career_guidance_access: "Attend notices issued on college website/noticeboard or approach the Career Cell office during working hours. College maintains a record of placement events on its 'Placement' tag.",
    
    placement_cell_role: "Liaisons with industry, organises placement drives, skill-development tie-ups and tracks placement outcomes.",
    placement_cell_activity: "Campus placement drives recorded (local employers, banks); historical placement rate data on public portals shows modest placement activity — some reports list placement rate ≈20% and packages in local ranges (example portal data). For authoritative figures always use Placement Cell's yearly report.",
    
    grievance_mandate: "Address student complaints (academic, infrastructure, harassment, financial) through an institutional grievance policy; grievances are to be submitted to the Principal/Cell and addressed per the policy timeline. Process and policy document available on college website.",
    
    anti_ragging_mandate: "Ensure ragging-free campus in line with UGC regulations. Committee members and convener names are published in staff committees documents. Complaints are handled immediately and per UGC norms.",
    
    women_cell_mandate: "Prevent and redress sexual harassment; gender-sensitivity programs; women's empowerment activities. ICC / Women Cell constituted and documented in Gender Audit and related files. Students can approach ICC / Women Cell as per the internal complaint mechanism.",
    
    scst_minority_mandate: "Monitor implementation of welfare schemes, scholarship facilitation, academic support and special grievance redressal for reserved categories. Committees and nodal officers are listed in the Staff-Committees PDF.",
    
    alumni_activity: "Active alumni network — regular alumni meets (e.g., Alumni Meet 19 Oct 2024) and contributions to college activities, mentorship and donor scholarships. Alumni committee exists and annual events are posted on the college site.",
    
    nss_ncc_mandate: "Extension activities (tree plantation, road safety), National Service Scheme (NSS), NCC and cultural clubs which support personality development and community outreach; details appear in AQAR / Yearly Status Reports.",
    
    access_process_career: "Follow notices on website → register with Career Cell → attend drives/trainings.",
    access_process_grievance: "Submit written complaint to the Grievance Cell/Principal as per the Grievance Policy PDF.",
    access_process_anti_ragging: "Report immediately to Anti-Ragging Committee (names/contacts on Staff-Committees PDF).",
    access_process_women: "Approach ICC convener or Women Cell members — Gender Audit and ICC guidelines available on site.",
    access_process_scst: "Contact the SC/ST/Minority Nodal Officer listed in Staff Committees PDF.",
  });

  const [isEditing, setIsEditing] = useState(false);

  const { data: studentSupportData } = useQuery({
    queryKey: ["/api/admin/general-info/student-support-services"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/student-support-services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (studentSupportData) {
      setFormData({
        overview: studentSupportData.overview || formData.overview,
        career_guidance_purpose: studentSupportData.career_guidance_purpose || formData.career_guidance_purpose,
        career_guidance_activities: studentSupportData.career_guidance_activities || formData.career_guidance_activities,
        career_guidance_access: studentSupportData.career_guidance_access || formData.career_guidance_access,
        placement_cell_role: studentSupportData.placement_cell_role || formData.placement_cell_role,
        placement_cell_activity: studentSupportData.placement_cell_activity || formData.placement_cell_activity,
        grievance_mandate: studentSupportData.grievance_mandate || formData.grievance_mandate,
        anti_ragging_mandate: studentSupportData.anti_ragging_mandate || formData.anti_ragging_mandate,
        women_cell_mandate: studentSupportData.women_cell_mandate || formData.women_cell_mandate,
        scst_minority_mandate: studentSupportData.scst_minority_mandate || formData.scst_minority_mandate,
        alumni_activity: studentSupportData.alumni_activity || formData.alumni_activity,
        nss_ncc_mandate: studentSupportData.nss_ncc_mandate || formData.nss_ncc_mandate,
        access_process_career: studentSupportData.access_process_career || formData.access_process_career,
        access_process_grievance: studentSupportData.access_process_grievance || formData.access_process_grievance,
        access_process_anti_ragging: studentSupportData.access_process_anti_ragging || formData.access_process_anti_ragging,
        access_process_women: studentSupportData.access_process_women || formData.access_process_women,
        access_process_scst: studentSupportData.access_process_scst || formData.access_process_scst,
      });
    }
  }, [studentSupportData]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin/general-info/student-support-services", {
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
      toast({ title: "Success", description: "Student Support & Services information updated successfully" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info/student-support-services"] });
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
          <h2 className="text-2xl font-bold">Student Support & Services</h2>
          <p className="text-sm text-gray-600">Manage student welfare, counseling, and support services</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="overview">Overview</Label>
            {isEditing ? (
              <Textarea
                id="overview"
                value={formData.overview}
                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.overview}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Career Guidance & Counseling Cell
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="career_guidance_purpose">Purpose</Label>
            {isEditing ? (
              <Textarea
                id="career_guidance_purpose"
                value={formData.career_guidance_purpose}
                onChange={(e) => setFormData({ ...formData, career_guidance_purpose: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.career_guidance_purpose}</p>
            )}
          </div>
          <div>
            <Label htmlFor="career_guidance_activities">Activities</Label>
            {isEditing ? (
              <Textarea
                id="career_guidance_activities"
                value={formData.career_guidance_activities}
                onChange={(e) => setFormData({ ...formData, career_guidance_activities: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.career_guidance_activities}</p>
            )}
          </div>
          <div>
            <Label htmlFor="career_guidance_access">How Students Apply</Label>
            {isEditing ? (
              <Textarea
                id="career_guidance_access"
                value={formData.career_guidance_access}
                onChange={(e) => setFormData({ ...formData, career_guidance_access: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.career_guidance_access}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Placement Cell
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="placement_cell_role">Role</Label>
            {isEditing ? (
              <Textarea
                id="placement_cell_role"
                value={formData.placement_cell_role}
                onChange={(e) => setFormData({ ...formData, placement_cell_role: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.placement_cell_role}</p>
            )}
          </div>
          <div>
            <Label htmlFor="placement_cell_activity">Recent Activity & Metrics</Label>
            {isEditing ? (
              <Textarea
                id="placement_cell_activity"
                value={formData.placement_cell_activity}
                onChange={(e) => setFormData({ ...formData, placement_cell_activity: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.placement_cell_activity}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-orange-600" />
            Grievance Redressal Cell
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="grievance_mandate">Mandate</Label>
            {isEditing ? (
              <Textarea
                id="grievance_mandate"
                value={formData.grievance_mandate}
                onChange={(e) => setFormData({ ...formData, grievance_mandate: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.grievance_mandate}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Anti-Ragging Committee & Squad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="anti_ragging_mandate">Mandate</Label>
            {isEditing ? (
              <Textarea
                id="anti_ragging_mandate"
                value={formData.anti_ragging_mandate}
                onChange={(e) => setFormData({ ...formData, anti_ragging_mandate: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.anti_ragging_mandate}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600" />
            Women Cell / ICC & Gender Sensitization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="women_cell_mandate">Mandate</Label>
            {isEditing ? (
              <Textarea
                id="women_cell_mandate"
                value={formData.women_cell_mandate}
                onChange={(e) => setFormData({ ...formData, women_cell_mandate: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.women_cell_mandate}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-600" />
            SC/ST / Minority / Other Welfare Cells
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="scst_minority_mandate">Mandate</Label>
            {isEditing ? (
              <Textarea
                id="scst_minority_mandate"
                value={formData.scst_minority_mandate}
                onChange={(e) => setFormData({ ...formData, scst_minority_mandate: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.scst_minority_mandate}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandHeart className="h-5 w-5 text-teal-600" />
            Alumni Association
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="alumni_activity">Activity</Label>
            {isEditing ? (
              <Textarea
                id="alumni_activity"
                value={formData.alumni_activity}
                onChange={(e) => setFormData({ ...formData, alumni_activity: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.alumni_activity}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-600" />
            NSS / NCC / Student Clubs & Extra-Curricular Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="nss_ncc_mandate">Mandate</Label>
            {isEditing ? (
              <Textarea
                id="nss_ncc_mandate"
                value={formData.nss_ncc_mandate}
                onChange={(e) => setFormData({ ...formData, nss_ncc_mandate: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.nss_ncc_mandate}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            How to Access / File Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="access_process_career">Career/Placement</Label>
            {isEditing ? (
              <Input
                id="access_process_career"
                value={formData.access_process_career}
                onChange={(e) => setFormData({ ...formData, access_process_career: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.access_process_career}</p>
            )}
          </div>
          <div>
            <Label htmlFor="access_process_grievance">Grievance</Label>
            {isEditing ? (
              <Input
                id="access_process_grievance"
                value={formData.access_process_grievance}
                onChange={(e) => setFormData({ ...formData, access_process_grievance: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.access_process_grievance}</p>
            )}
          </div>
          <div>
            <Label htmlFor="access_process_anti_ragging">Anti-Ragging</Label>
            {isEditing ? (
              <Input
                id="access_process_anti_ragging"
                value={formData.access_process_anti_ragging}
                onChange={(e) => setFormData({ ...formData, access_process_anti_ragging: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.access_process_anti_ragging}</p>
            )}
          </div>
          <div>
            <Label htmlFor="access_process_women">Women/ICC</Label>
            {isEditing ? (
              <Input
                id="access_process_women"
                value={formData.access_process_women}
                onChange={(e) => setFormData({ ...formData, access_process_women: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.access_process_women}</p>
            )}
          </div>
          <div>
            <Label htmlFor="access_process_scst">SC/ST/Minority Support</Label>
            {isEditing ? (
              <Input
                id="access_process_scst"
                value={formData.access_process_scst}
                onChange={(e) => setFormData({ ...formData, access_process_scst: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.access_process_scst}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {studentSupportData?.updated_at && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(studentSupportData.updated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
