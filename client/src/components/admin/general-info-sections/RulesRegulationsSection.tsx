import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Save, Clock, FileText, ShirtIcon, Home as HomeIcon, AlertCircle, Plus, Trash2 } from "lucide-react";

interface RulesRegulationsSectionProps {
  data: any;
  onUpdate: () => void;
}

interface AttendanceTier {
  id: string;
  range: string;
  marks: string;
  condition?: string;
}

export function RulesRegulationsSection({ data, onUpdate }: RulesRegulationsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    mandatory_attendance: "A minimum of 75% attendance in theory classes is required for students to be eligible to appear in the final examinations.",
    punctuality: "Students must be punctual for all classes. Late entries may be restricted by the faculty.",
    
    internal_assessment_description: "20% internal assessment is conducted for all theory papers, distributed as follows: Two handwritten assignments (10%), One class test (5%), and Attendance (5%).",
    seating_capacity: "The college has dedicated examination blocks, each with a seating capacity of 800 students.",
    cctv_surveillance: "Examination rooms and corridors are monitored by CCTV cameras to ensure fair and transparent conduct.",
    verification: "During examinations, students must produce their admit card and college identity card at the entry gate.",
    parental_communication: "Mid-term exam notices and important updates are regularly published, and parents are kept informed about exam-related matters.",
    
    dress_code_description: "To maintain academic decorum, students are required to wear decent and appropriate clothes at all times.",
    dress_code_enforcement: "The dress code is strictly enforced to promote a respectful and focused learning environment.",
    
    hostel_facility: "The college does not provide on-campus hostel accommodation.",
    nearby_options: "Several PGs and private accommodations are conveniently located near the campus.",
    
    identity_card_rule: "All students must carry their college identity card and produce it upon request. Entry without a valid ID card is prohibited.",
    ragging_ban: "Ragging is strictly prohibited. Any student found involved in ragging will face severe disciplinary action in accordance with college and UGC norms.",
    general_conduct: "Students must not create disturbances and are expected to maintain discipline within the campus. Littering is forbidden; cleanliness must be maintained. Permission from the Principal is mandatory before using the college name or premises for any external activity or event.",
    safety_rules: "Vehicles must be parked in designated areas only. Wearing a helmet is compulsory for all riders.",
    prohibited_activities: "Political or antisocial activities are strictly banned on campus.",
    grievance_discipline: "The college has a Discipline Committee and a Grievance Redressal Cell to resolve student concerns and maintain a positive academic environment.",
  });

  const [attendanceTiers, setAttendanceTiers] = useState<AttendanceTier[]>([
    { id: "1", range: "91% and above", marks: "5 marks", condition: "" },
    { id: "2", range: "81% to 90%", marks: "4 marks", condition: "" },
    { id: "3", range: "75% to 80%", marks: "3 marks", condition: "" },
    { id: "4", range: "70% to 74%", marks: "2 marks", condition: "Exceptions may be made for students participating in college-related co-curricular activities, with prior approval of the Principal" },
    { id: "5", range: "65% to 69%", marks: "1 mark", condition: "For students with valid medical grounds, approved by the Principal" },
  ]);

  const [newTier, setNewTier] = useState({ range: "", marks: "", condition: "" });
  const [isEditing, setIsEditing] = useState(false);

  const { data: rulesData } = useQuery({
    queryKey: ["/api/admin/general-info/rules-regulations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/rules-regulations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (rulesData) {
      setFormData({
        mandatory_attendance: rulesData.mandatory_attendance || formData.mandatory_attendance,
        punctuality: rulesData.punctuality || formData.punctuality,
        internal_assessment_description: rulesData.internal_assessment_description || formData.internal_assessment_description,
        seating_capacity: rulesData.seating_capacity || formData.seating_capacity,
        cctv_surveillance: rulesData.cctv_surveillance || formData.cctv_surveillance,
        verification: rulesData.verification || formData.verification,
        parental_communication: rulesData.parental_communication || formData.parental_communication,
        dress_code_description: rulesData.dress_code_description || formData.dress_code_description,
        dress_code_enforcement: rulesData.dress_code_enforcement || formData.dress_code_enforcement,
        hostel_facility: rulesData.hostel_facility || formData.hostel_facility,
        nearby_options: rulesData.nearby_options || formData.nearby_options,
        identity_card_rule: rulesData.identity_card_rule || formData.identity_card_rule,
        ragging_ban: rulesData.ragging_ban || formData.ragging_ban,
        general_conduct: rulesData.general_conduct || formData.general_conduct,
        safety_rules: rulesData.safety_rules || formData.safety_rules,
        prohibited_activities: rulesData.prohibited_activities || formData.prohibited_activities,
        grievance_discipline: rulesData.grievance_discipline || formData.grievance_discipline,
      });
      if (rulesData.attendance_tiers) {
        setAttendanceTiers(rulesData.attendance_tiers);
      }
    }
  }, [rulesData]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/general-info/rules-regulations", {
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
      toast({ title: "Success", description: "Rules & Regulations information updated successfully" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info/rules-regulations"] });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...formData,
      attendance_tiers: attendanceTiers,
    });
  };

  const addAttendanceTier = () => {
    if (newTier.range.trim() && newTier.marks.trim()) {
      setAttendanceTiers([...attendanceTiers, { 
        id: Date.now().toString(), 
        range: newTier.range, 
        marks: newTier.marks,
        condition: newTier.condition
      }]);
      setNewTier({ range: "", marks: "", condition: "" });
    }
  };

  const removeAttendanceTier = (id: string) => {
    setAttendanceTiers(attendanceTiers.filter(t => t.id !== id));
  };

  const updateAttendanceTier = (id: string, field: keyof AttendanceTier, value: string) => {
    setAttendanceTiers(attendanceTiers.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Rules & Regulations</h2>
          <p className="text-sm text-gray-600">Manage attendance rules, examination policy, dress code and disciplinary policies</p>
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

      {/* Attendance Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Attendance Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mandatory_attendance">Mandatory Attendance</Label>
            {isEditing ? (
              <Textarea
                id="mandatory_attendance"
                value={formData.mandatory_attendance}
                onChange={(e) => setFormData({ ...formData, mandatory_attendance: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.mandatory_attendance}</p>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Internal Marks Distribution (Attendance-based)</Label>
            <div className="space-y-2">
              {attendanceTiers.map((tier) => (
                <Card key={tier.id} className="bg-gray-50">
                  <CardContent className="p-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Range (e.g., 91% and above)"
                            value={tier.range}
                            onChange={(e) => updateAttendanceTier(tier.id, 'range', e.target.value)}
                          />
                          <Input
                            placeholder="Marks (e.g., 5 marks)"
                            value={tier.marks}
                            onChange={(e) => updateAttendanceTier(tier.id, 'marks', e.target.value)}
                          />
                        </div>
                        <Input
                          placeholder="Condition (optional)"
                          value={tier.condition || ""}
                          onChange={(e) => updateAttendanceTier(tier.id, 'condition', e.target.value)}
                        />
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeAttendanceTier(tier.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-sm">
                          <span className="text-blue-600">{tier.range}</span>: {tier.marks}
                        </p>
                        {tier.condition && (
                          <p className="text-xs text-gray-600 mt-1 italic">{tier.condition}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {isEditing && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <Label className="text-xs mb-2 block">Add New Attendance Tier</Label>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Range (e.g., 91% and above)"
                          value={newTier.range}
                          onChange={(e) => setNewTier({ ...newTier, range: e.target.value })}
                          className="bg-white"
                        />
                        <Input
                          placeholder="Marks (e.g., 5 marks)"
                          value={newTier.marks}
                          onChange={(e) => setNewTier({ ...newTier, marks: e.target.value })}
                          className="bg-white"
                        />
                      </div>
                      <Input
                        placeholder="Condition (optional)"
                        value={newTier.condition}
                        onChange={(e) => setNewTier({ ...newTier, condition: e.target.value })}
                        className="bg-white"
                      />
                      <Button onClick={addAttendanceTier} size="sm" className="w-full">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Tier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="punctuality">Punctuality</Label>
            {isEditing ? (
              <Textarea
                id="punctuality"
                value={formData.punctuality}
                onChange={(e) => setFormData({ ...formData, punctuality: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.punctuality}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Examination Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Examination Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="internal_assessment_description">Internal Assessment</Label>
            {isEditing ? (
              <Textarea
                id="internal_assessment_description"
                value={formData.internal_assessment_description}
                onChange={(e) => setFormData({ ...formData, internal_assessment_description: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.internal_assessment_description}</p>
            )}
          </div>

          <div>
            <Label htmlFor="seating_capacity">Seating Capacity</Label>
            {isEditing ? (
              <Textarea
                id="seating_capacity"
                value={formData.seating_capacity}
                onChange={(e) => setFormData({ ...formData, seating_capacity: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.seating_capacity}</p>
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
            <Label htmlFor="verification">Verification Requirements</Label>
            {isEditing ? (
              <Textarea
                id="verification"
                value={formData.verification}
                onChange={(e) => setFormData({ ...formData, verification: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.verification}</p>
            )}
          </div>

          <div>
            <Label htmlFor="parental_communication">Parental Communication</Label>
            {isEditing ? (
              <Textarea
                id="parental_communication"
                value={formData.parental_communication}
                onChange={(e) => setFormData({ ...formData, parental_communication: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.parental_communication}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dress Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShirtIcon className="h-5 w-5 text-green-600" />
            Dress Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="dress_code_description">Dress Code Policy</Label>
            {isEditing ? (
              <Textarea
                id="dress_code_description"
                value={formData.dress_code_description}
                onChange={(e) => setFormData({ ...formData, dress_code_description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.dress_code_description}</p>
            )}
          </div>

          <div>
            <Label htmlFor="dress_code_enforcement">Enforcement</Label>
            {isEditing ? (
              <Textarea
                id="dress_code_enforcement"
                value={formData.dress_code_enforcement}
                onChange={(e) => setFormData({ ...formData, dress_code_enforcement: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.dress_code_enforcement}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hostel Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HomeIcon className="h-5 w-5 text-orange-600" />
            Hostel Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="hostel_facility">Hostel Facility Status</Label>
            {isEditing ? (
              <Textarea
                id="hostel_facility"
                value={formData.hostel_facility}
                onChange={(e) => setFormData({ ...formData, hostel_facility: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.hostel_facility}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nearby_options">Nearby Options</Label>
            {isEditing ? (
              <Textarea
                id="nearby_options"
                value={formData.nearby_options}
                onChange={(e) => setFormData({ ...formData, nearby_options: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.nearby_options}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disciplinary Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Disciplinary Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="identity_card_rule">Identity Card Rule</Label>
            {isEditing ? (
              <Textarea
                id="identity_card_rule"
                value={formData.identity_card_rule}
                onChange={(e) => setFormData({ ...formData, identity_card_rule: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.identity_card_rule}</p>
            )}
          </div>

          <div>
            <Label htmlFor="ragging_ban">Ragging Ban</Label>
            {isEditing ? (
              <Textarea
                id="ragging_ban"
                value={formData.ragging_ban}
                onChange={(e) => setFormData({ ...formData, ragging_ban: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.ragging_ban}</p>
            )}
          </div>

          <div>
            <Label htmlFor="general_conduct">General Conduct</Label>
            {isEditing ? (
              <Textarea
                id="general_conduct"
                value={formData.general_conduct}
                onChange={(e) => setFormData({ ...formData, general_conduct: e.target.value })}
                rows={4}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.general_conduct}</p>
            )}
          </div>

          <div>
            <Label htmlFor="safety_rules">Safety Rules</Label>
            {isEditing ? (
              <Textarea
                id="safety_rules"
                value={formData.safety_rules}
                onChange={(e) => setFormData({ ...formData, safety_rules: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.safety_rules}</p>
            )}
          </div>

          <div>
            <Label htmlFor="prohibited_activities">Prohibited Activities</Label>
            {isEditing ? (
              <Textarea
                id="prohibited_activities"
                value={formData.prohibited_activities}
                onChange={(e) => setFormData({ ...formData, prohibited_activities: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.prohibited_activities}</p>
            )}
          </div>

          <div>
            <Label htmlFor="grievance_discipline">Grievance & Discipline Committees</Label>
            {isEditing ? (
              <Textarea
                id="grievance_discipline"
                value={formData.grievance_discipline}
                onChange={(e) => setFormData({ ...formData, grievance_discipline: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.grievance_discipline}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
