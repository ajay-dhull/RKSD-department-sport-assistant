import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Save, Award, Gift, Trash2, Plus, ExternalLink, FileText, DollarSign } from "lucide-react";

interface ScholarshipsFinancialAidSectionProps {
  data: any;
  onUpdate: () => void;
}

interface DonorScholarship {
  id: string;
  name: string;
  amount: string;
  donor: string;
  description?: string;
}

interface GovernmentScholarship {
  id: string;
  name: string;
  description: string;
  platform: string;
}

interface ApplicationStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
}

export function ScholarshipsFinancialAidSection({ data, onUpdate }: ScholarshipsFinancialAidSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    overview: "R.K.S.D. (P.G.) College, Kaithal provides financial assistance to deserving students through a blend of college-specific donor scholarships, Student Aid Fund freeships, and government-sponsored schemes. All scholarships aim to encourage academic excellence, support economically weaker students, and promote inclusive education.",
    
    eligibility_freeships: "For orphans and students from financially weaker sections.",
    eligibility_merit_awards: "For students excelling in academics, sports, or cultural activities.",
    eligibility_general_conditions: "Recipients must maintain minimum attendance, follow college code of conduct, and show satisfactory academic performance for continuation.",
    
    har_chhatravratti_link: "https://harchhatravratti.highereduhry.ac.in",
    nsp_link: "https://scholarships.gov.in",
    
    important_notes_timeline: "Online applications generally open July–September 2025 (depending on scheme).",
    important_notes_documents: "Required documents include Caste Certificate, Income Certificate, Aadhaar, Bank Passbook, Mark Sheets, and Bonafide Certificate from the college.",
    important_notes_updates: "Students should regularly check notice boards and official portals for deadlines and status updates.",
  });

  const [donorScholarships, setDonorScholarships] = useState<DonorScholarship[]>([
    {
      id: "1",
      name: "R.G. Charitable Trust",
      donor: "New Delhi",
      amount: "₹ 2,00,000",
      description: ""
    },
    {
      id: "2",
      name: "Krishna–Gopi Nath Memorial Scholarship",
      donor: "Dr. Sanjay Goyal",
      amount: "₹ 20,000",
      description: ""
    },
    {
      id: "3",
      name: "Nirmal S.L. Mangal Memorial Scholarship",
      donor: "Dr. Geeta Goyal",
      amount: "₹ 20,000",
      description: ""
    },
    {
      id: "4",
      name: "Saroj Bhardwaj Balika Vikas Scholarship",
      donor: "College Trust",
      amount: "Variable",
      description: "For meritorious girl students"
    },
    {
      id: "5",
      name: "Additional Donor Awards",
      donor: "Alumni, Faculty, and Local Philanthropists",
      amount: "Variable",
      description: "Distributed annually based on merit and need"
    }
  ]);

  const [applicationSteps, setApplicationSteps] = useState<ApplicationStep[]>([
    {
      id: "1",
      stepNumber: 1,
      title: "Application Submission",
      description: "Students apply through the Student Welfare Committee during the notified period."
    },
    {
      id: "2",
      stepNumber: 2,
      title: "Faculty Recommendation",
      description: "Each application must carry a recommendation from a faculty member."
    },
    {
      id: "3",
      stepNumber: 3,
      title: "Scrutiny & Approval",
      description: "The committee reviews applications and forwards recommendations to the Principal for final approval."
    },
    {
      id: "4",
      stepNumber: 4,
      title: "Renewal",
      description: "Granted annually on the basis of academic progress and disciplinary record."
    }
  ]);

  const [governmentScholarships, setGovernmentScholarships] = useState<GovernmentScholarship[]>([
    {
      id: "1",
      name: "Post-Matric Scholarship (SC/BC)",
      description: "For students of Scheduled Castes and Backward Classes in Haryana",
      platform: "National Scholarship Portal (NSP)"
    },
    {
      id: "2",
      name: "Har-Chhatravratti Portal Schemes",
      description: "Consolidated Haryana Govt. scholarships for UG/PG students – SC/BC/EWS/Disabled categories",
      platform: "Har-Chhatravratti Portal"
    },
    {
      id: "3",
      name: "Merit Scholarship to Undergraduate Girls",
      description: "For meritorious female students pursuing UG programs",
      platform: "Har-Chhatravratti"
    },
    {
      id: "4",
      name: "Haryana State Merit Scholarship Scheme",
      description: "For students from economically weaker sections with high merit",
      platform: "Har-Chhatravratti"
    },
    {
      id: "5",
      name: "Disabled Scholarship",
      description: "For students with physical disabilities (≥ 40 %)",
      platform: "Har-Chhatravratti / NSP"
    },
    {
      id: "6",
      name: "National Merit / State Merit / Silver Jubilee Scholarships",
      description: "Based on board/university exam performance",
      platform: "NSP / DHE Haryana"
    }
  ]);

  const [newDonorScholarship, setNewDonorScholarship] = useState({ name: "", donor: "", amount: "", description: "" });
  const [newApplicationStep, setNewApplicationStep] = useState({ stepNumber: 0, title: "", description: "" });
  const [newGovtScholarship, setNewGovtScholarship] = useState({ name: "", description: "", platform: "" });
  const [isEditing, setIsEditing] = useState(false);

  const { data: scholarshipsData } = useQuery({
    queryKey: ["/api/admin/general-info/scholarships-financial-aid"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/scholarships-financial-aid", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (scholarshipsData) {
      setFormData({
        overview: scholarshipsData.overview || formData.overview,
        eligibility_freeships: scholarshipsData.eligibility_freeships || formData.eligibility_freeships,
        eligibility_merit_awards: scholarshipsData.eligibility_merit_awards || formData.eligibility_merit_awards,
        eligibility_general_conditions: scholarshipsData.eligibility_general_conditions || formData.eligibility_general_conditions,
        har_chhatravratti_link: scholarshipsData.har_chhatravratti_link || formData.har_chhatravratti_link,
        nsp_link: scholarshipsData.nsp_link || formData.nsp_link,
        important_notes_timeline: scholarshipsData.important_notes_timeline || formData.important_notes_timeline,
        important_notes_documents: scholarshipsData.important_notes_documents || formData.important_notes_documents,
        important_notes_updates: scholarshipsData.important_notes_updates || formData.important_notes_updates,
      });
      if (scholarshipsData.donor_scholarships) {
        setDonorScholarships(scholarshipsData.donor_scholarships);
      }
      if (scholarshipsData.application_steps) {
        setApplicationSteps(scholarshipsData.application_steps);
      }
      if (scholarshipsData.government_scholarships) {
        setGovernmentScholarships(scholarshipsData.government_scholarships);
      }
    }
  }, [scholarshipsData]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/general-info/scholarships-financial-aid", {
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
      toast({ title: "Success", description: "Scholarships & Financial Aid information updated successfully" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info/scholarships-financial-aid"] });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...formData,
      donor_scholarships: donorScholarships,
      application_steps: applicationSteps,
      government_scholarships: governmentScholarships,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addDonorScholarship = () => {
    if (newDonorScholarship.name.trim() && newDonorScholarship.donor.trim()) {
      setDonorScholarships([...donorScholarships, { 
        id: Date.now().toString(), 
        ...newDonorScholarship 
      }]);
      setNewDonorScholarship({ name: "", donor: "", amount: "", description: "" });
    }
  };

  const removeDonorScholarship = (id: string) => {
    setDonorScholarships(donorScholarships.filter(s => s.id !== id));
  };

  const updateDonorScholarship = (id: string, field: keyof DonorScholarship, value: string) => {
    setDonorScholarships(donorScholarships.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const addApplicationStep = () => {
    if (newApplicationStep.title.trim() && newApplicationStep.description.trim()) {
      setApplicationSteps([...applicationSteps, { 
        id: Date.now().toString(), 
        stepNumber: newApplicationStep.stepNumber || applicationSteps.length + 1,
        title: newApplicationStep.title, 
        description: newApplicationStep.description 
      }]);
      setNewApplicationStep({ stepNumber: 0, title: "", description: "" });
    }
  };

  const removeApplicationStep = (id: string) => {
    setApplicationSteps(applicationSteps.filter(s => s.id !== id));
  };

  const updateApplicationStep = (id: string, field: keyof ApplicationStep, value: string | number) => {
    setApplicationSteps(applicationSteps.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const addGovtScholarship = () => {
    if (newGovtScholarship.name.trim() && newGovtScholarship.description.trim()) {
      setGovernmentScholarships([...governmentScholarships, { 
        id: Date.now().toString(), 
        ...newGovtScholarship 
      }]);
      setNewGovtScholarship({ name: "", description: "", platform: "" });
    }
  };

  const removeGovtScholarship = (id: string) => {
    setGovernmentScholarships(governmentScholarships.filter(s => s.id !== id));
  };

  const updateGovtScholarship = (id: string, field: keyof GovernmentScholarship, value: string) => {
    setGovernmentScholarships(governmentScholarships.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Scholarships & Financial Aid</h3>
          <p className="text-sm text-gray-600 mt-1">College scholarships, government schemes, and application process</p>
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

      <div className="space-y-6">
        {/* Overview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-blue-600" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={formData.overview}
                onChange={(e) => handleChange("overview", e.target.value)}
                disabled={!isEditing}
                rows={4}
                placeholder="Overview of scholarships and financial aid..."
              />
            </div>
          </CardContent>
        </Card>

        {/* College-Specific Donor Scholarships */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-5 w-5 text-purple-600" />
              College-Specific Donor Scholarships
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {donorScholarships.map((scholarship) => (
              <div key={scholarship.id} className="border p-4 rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Scholarship Name</Label>
                      <Input
                        value={scholarship.name}
                        onChange={(e) => updateDonorScholarship(scholarship.id, 'name', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Scholarship name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Donor</Label>
                      <Input
                        value={scholarship.donor}
                        onChange={(e) => updateDonorScholarship(scholarship.id, 'donor', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Donor name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Amount</Label>
                      <Input
                        value={scholarship.amount}
                        onChange={(e) => updateDonorScholarship(scholarship.id, 'amount', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Amount"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label className="text-xs">Description (Optional)</Label>
                      <Textarea
                        value={scholarship.description || ""}
                        onChange={(e) => updateDonorScholarship(scholarship.id, 'description', e.target.value)}
                        disabled={!isEditing}
                        rows={2}
                        placeholder="Additional description..."
                      />
                    </div>
                  </div>
                  {isEditing && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeDonorScholarship(scholarship.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {isEditing && (
              <div className="border-2 border-dashed p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    value={newDonorScholarship.name}
                    onChange={(e) => setNewDonorScholarship({ ...newDonorScholarship, name: e.target.value })}
                    placeholder="Scholarship name"
                  />
                  <Input
                    value={newDonorScholarship.donor}
                    onChange={(e) => setNewDonorScholarship({ ...newDonorScholarship, donor: e.target.value })}
                    placeholder="Donor name"
                  />
                  <Input
                    value={newDonorScholarship.amount}
                    onChange={(e) => setNewDonorScholarship({ ...newDonorScholarship, amount: e.target.value })}
                    placeholder="Amount"
                  />
                  <Textarea
                    value={newDonorScholarship.description}
                    onChange={(e) => setNewDonorScholarship({ ...newDonorScholarship, description: e.target.value })}
                    rows={2}
                    placeholder="Description (optional)"
                    className="md:col-span-3"
                  />
                </div>
                <Button onClick={addDonorScholarship} size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Donor Scholarship
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Eligibility Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-green-600" />
              Eligibility Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Freeships (Student Aid Fund)</Label>
              <Textarea
                value={formData.eligibility_freeships}
                onChange={(e) => handleChange("eligibility_freeships", e.target.value)}
                disabled={!isEditing}
                rows={2}
                placeholder="Freeship eligibility..."
              />
            </div>
            <div className="space-y-2">
              <Label>Merit Awards</Label>
              <Textarea
                value={formData.eligibility_merit_awards}
                onChange={(e) => handleChange("eligibility_merit_awards", e.target.value)}
                disabled={!isEditing}
                rows={2}
                placeholder="Merit award eligibility..."
              />
            </div>
            <div className="space-y-2">
              <Label>General Conditions</Label>
              <Textarea
                value={formData.eligibility_general_conditions}
                onChange={(e) => handleChange("eligibility_general_conditions", e.target.value)}
                disabled={!isEditing}
                rows={2}
                placeholder="General conditions..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Application & Renewal Process */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-orange-600" />
              Application & Renewal Process (Internal)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {applicationSteps.sort((a, b) => a.stepNumber - b.stepNumber).map((step) => (
              <div key={step.id} className="border p-4 rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={step.stepNumber}
                        onChange={(e) => updateApplicationStep(step.id, 'stepNumber', parseInt(e.target.value))}
                        disabled={!isEditing}
                        placeholder="#"
                        className="w-16 font-bold"
                      />
                      <Input
                        value={step.title}
                        onChange={(e) => updateApplicationStep(step.id, 'title', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Step title"
                        className="font-medium flex-1"
                      />
                    </div>
                    <Textarea
                      value={step.description}
                      onChange={(e) => updateApplicationStep(step.id, 'description', e.target.value)}
                      disabled={!isEditing}
                      rows={2}
                      placeholder="Step description"
                    />
                  </div>
                  {isEditing && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeApplicationStep(step.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {isEditing && (
              <div className="border-2 border-dashed p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={newApplicationStep.stepNumber || ""}
                    onChange={(e) => setNewApplicationStep({ ...newApplicationStep, stepNumber: parseInt(e.target.value) || 0 })}
                    placeholder="#"
                    className="w-16"
                  />
                  <Input
                    value={newApplicationStep.title}
                    onChange={(e) => setNewApplicationStep({ ...newApplicationStep, title: e.target.value })}
                    placeholder="Step title"
                    className="flex-1"
                  />
                </div>
                <Textarea
                  value={newApplicationStep.description}
                  onChange={(e) => setNewApplicationStep({ ...newApplicationStep, description: e.target.value })}
                  rows={2}
                  placeholder="Step description"
                />
                <Button onClick={addApplicationStep} size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* External / Government Scholarships */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-red-600" />
              External / Government Scholarships
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {governmentScholarships.map((scholarship) => (
              <div key={scholarship.id} className="border p-4 rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={scholarship.name}
                      onChange={(e) => updateGovtScholarship(scholarship.id, 'name', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Scholarship name"
                      className="font-medium"
                    />
                    <Textarea
                      value={scholarship.description}
                      onChange={(e) => updateGovtScholarship(scholarship.id, 'description', e.target.value)}
                      disabled={!isEditing}
                      rows={2}
                      placeholder="Description / Eligibility"
                    />
                    <Input
                      value={scholarship.platform}
                      onChange={(e) => updateGovtScholarship(scholarship.id, 'platform', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Application Platform"
                    />
                  </div>
                  {isEditing && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeGovtScholarship(scholarship.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {isEditing && (
              <div className="border-2 border-dashed p-4 rounded-lg space-y-2">
                <Input
                  value={newGovtScholarship.name}
                  onChange={(e) => setNewGovtScholarship({ ...newGovtScholarship, name: e.target.value })}
                  placeholder="Scholarship name"
                />
                <Textarea
                  value={newGovtScholarship.description}
                  onChange={(e) => setNewGovtScholarship({ ...newGovtScholarship, description: e.target.value })}
                  rows={2}
                  placeholder="Description / Eligibility"
                />
                <Input
                  value={newGovtScholarship.platform}
                  onChange={(e) => setNewGovtScholarship({ ...newGovtScholarship, platform: e.target.value })}
                  placeholder="Application Platform"
                />
                <Button onClick={addGovtScholarship} size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Government Scholarship
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Portal Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ExternalLink className="h-5 w-5 text-teal-600" />
              Application Portal Links (External)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Har-Chhatravratti Portal (Haryana Govt.)</Label>
              <Input
                value={formData.har_chhatravratti_link}
                onChange={(e) => handleChange("har_chhatravratti_link", e.target.value)}
                disabled={!isEditing}
                placeholder="Har-Chhatravratti portal URL"
              />
            </div>
            <div className="space-y-2">
              <Label>National Scholarship Portal (NSP)</Label>
              <Input
                value={formData.nsp_link}
                onChange={(e) => handleChange("nsp_link", e.target.value)}
                disabled={!isEditing}
                placeholder="NSP portal URL"
              />
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-indigo-600" />
              Important Notes (for 2025-26 Session)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Application Timeline</Label>
              <Textarea
                value={formData.important_notes_timeline}
                onChange={(e) => handleChange("important_notes_timeline", e.target.value)}
                disabled={!isEditing}
                rows={2}
                placeholder="Timeline information..."
              />
            </div>
            <div className="space-y-2">
              <Label>Required Documents</Label>
              <Textarea
                value={formData.important_notes_documents}
                onChange={(e) => handleChange("important_notes_documents", e.target.value)}
                disabled={!isEditing}
                rows={3}
                placeholder="List of required documents..."
              />
            </div>
            <div className="space-y-2">
              <Label>Updates & Notifications</Label>
              <Textarea
                value={formData.important_notes_updates}
                onChange={(e) => handleChange("important_notes_updates", e.target.value)}
                disabled={!isEditing}
                rows={2}
                placeholder="Information about updates..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {scholarshipsData && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(scholarshipsData.updated_at || Date.now()).toLocaleString()}
        </div>
      )}
    </div>
  );
}
