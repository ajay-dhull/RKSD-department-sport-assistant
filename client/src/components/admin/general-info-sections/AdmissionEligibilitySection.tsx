import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Save, GraduationCap, FileText, Trash2, Plus, Calendar, DollarSign, Link as LinkIcon } from "lucide-react";

interface AdmissionEligibilitySectionProps {
  data: any;
  onUpdate: () => void;
}

interface AdmissionStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
}

interface EligibilityCriteria {
  id: string;
  courseType: string;
  requirements: string;
}

interface Document {
  id: string;
  name: string;
}

interface FeeStructure {
  id: string;
  courseType: string;
  feeRange: string;
}

interface AdmissionTimeline {
  id: string;
  courseType: string;
  event: string;
  timeline: string;
}

export function AdmissionEligibilitySection({ data, onUpdate }: AdmissionEligibilitySectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    ug_portal_link: "https://admissions.highereduhry.ac.in",
    pg_portal_link: "https://rksdcollege.ac.in",
    fee_structure_note: "The fee structure varies by course, but generally falls within the following ranges for the 2025-26 session, as per reports:",
  });

  const [admissionSteps, setAdmissionSteps] = useState<AdmissionStep[]>([
    {
      id: "1",
      stepNumber: 1,
      title: "Online Registration",
      description: "Candidates must register and fill out the application form on the official centralized admission portal of the Directorate of Higher Education, Haryana, for undergraduate (UG) courses. For postgraduate (PG) courses, the process is handled either directly through the college or the Kurukshetra University portal."
    },
    {
      id: "2",
      stepNumber: 2,
      title: "Merit List",
      description: "The college prepares and releases a merit list based on the marks obtained in the qualifying examination (Class 12 for UG, Bachelor's degree for PG). This list is displayed on the college notice board and website."
    },
    {
      id: "3",
      stepNumber: 3,
      title: "Counselling and Document Verification",
      description: "Shortlisted candidates are called for online or physical counselling, depending on the academic session's guidelines. During this stage, documents are verified."
    },
    {
      id: "4",
      stepNumber: 4,
      title: "Fee Payment and Confirmation",
      description: "After successful document verification, selected candidates must pay the admission fee within the specified time to confirm their seat."
    }
  ]);

  const [eligibilityCriteria, setEligibilityCriteria] = useState<EligibilityCriteria[]>([
    {
      id: "1",
      courseType: "UG Courses (e.g., B.A., B.Sc., B.Com, BBA, BCA)",
      requirements: "Must have passed the 10+2 examination from a recognized board. Minimum marks vary depending on the course and category, but generally, it is around 45%–50%."
    },
    {
      id: "2",
      courseType: "PG Courses (e.g., M.A., M.Sc., M.Com)",
      requirements: "Must hold a relevant Bachelor's degree from a recognized university. Minimum marks generally fall between 45%–50%."
    }
  ]);

  const [documents, setDocuments] = useState<Document[]>([
    { id: "1", name: "Class 10th Marksheet and Certificate" },
    { id: "2", name: "Class 12th Marksheet and Certificate" },
    { id: "3", name: "Graduation Marksheet and Degree (for PG admissions)" },
    { id: "4", name: "Character Certificate from the institution last attended" },
    { id: "5", name: "Transfer Certificate (if applicable)" },
    { id: "6", name: "Caste Certificate (for reserved categories)" },
    { id: "7", name: "Recent passport-size photographs" },
    { id: "8", name: "Aadhaar card" },
    { id: "9", name: "Anti-Ragging Undertaking (to be submitted online)" }
  ]);

  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([
    {
      id: "1",
      courseType: "UG Courses",
      feeRange: "Approximately ₹15,000 to ₹20,000 annually"
    },
    {
      id: "2",
      courseType: "PG Courses",
      feeRange: "Approximately ₹20,000 to ₹25,000 annually"
    },
    {
      id: "3",
      courseType: "Self-financed courses (BCA and BBA)",
      feeRange: "May be slightly higher"
    }
  ]);

  const [admissionTimelines, setAdmissionTimelines] = useState<AdmissionTimeline[]>([
    { id: "1", courseType: "UG", event: "Online Registration", timeline: "May–June 2025" },
    { id: "2", courseType: "UG", event: "Merit List", timeline: "June–July 2025" },
    { id: "3", courseType: "UG", event: "Counselling/Admission", timeline: "July–August 2025" },
    { id: "4", courseType: "PG", event: "Online Registration", timeline: "June–July 2025" },
    { id: "5", courseType: "PG", event: "Merit List", timeline: "July–August 2025" },
    { id: "6", courseType: "PG", event: "Counselling/Admission", timeline: "August 2025" }
  ]);

  const [newStep, setNewStep] = useState({ stepNumber: 0, title: "", description: "" });
  const [newEligibility, setNewEligibility] = useState({ courseType: "", requirements: "" });
  const [newDocument, setNewDocument] = useState("");
  const [newFee, setNewFee] = useState({ courseType: "", feeRange: "" });
  const [newTimeline, setNewTimeline] = useState({ courseType: "", event: "", timeline: "" });
  const [isEditing, setIsEditing] = useState(false);

  const { data: admissionData } = useQuery({
    queryKey: ["/api/admin/general-info/admission-eligibility"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/admission-eligibility", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (admissionData) {
      setFormData({
        ug_portal_link: admissionData.ug_portal_link || formData.ug_portal_link,
        pg_portal_link: admissionData.pg_portal_link || formData.pg_portal_link,
        fee_structure_note: admissionData.fee_structure_note || formData.fee_structure_note,
      });
      if (admissionData.admission_steps) {
        setAdmissionSteps(admissionData.admission_steps);
      }
      if (admissionData.eligibility_criteria) {
        setEligibilityCriteria(admissionData.eligibility_criteria);
      }
      if (admissionData.documents) {
        setDocuments(admissionData.documents);
      }
      if (admissionData.fee_structures) {
        setFeeStructures(admissionData.fee_structures);
      }
      if (admissionData.admission_timelines) {
        setAdmissionTimelines(admissionData.admission_timelines);
      }
    }
  }, [admissionData]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/general-info/admission-eligibility", {
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
      toast({ title: "Success", description: "Admission & Eligibility information updated successfully" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info/admission-eligibility"] });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...formData,
      admission_steps: admissionSteps,
      eligibility_criteria: eligibilityCriteria,
      documents,
      fee_structures: feeStructures,
      admission_timelines: admissionTimelines,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addAdmissionStep = () => {
    if (newStep.title.trim() && newStep.description.trim()) {
      setAdmissionSteps([...admissionSteps, { 
        id: Date.now().toString(), 
        stepNumber: newStep.stepNumber || admissionSteps.length + 1,
        title: newStep.title, 
        description: newStep.description 
      }]);
      setNewStep({ stepNumber: 0, title: "", description: "" });
    }
  };

  const removeAdmissionStep = (id: string) => {
    setAdmissionSteps(admissionSteps.filter(s => s.id !== id));
  };

  const updateAdmissionStep = (id: string, field: keyof AdmissionStep, value: string | number) => {
    setAdmissionSteps(admissionSteps.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const addEligibility = () => {
    if (newEligibility.courseType.trim() && newEligibility.requirements.trim()) {
      setEligibilityCriteria([...eligibilityCriteria, { 
        id: Date.now().toString(), 
        courseType: newEligibility.courseType, 
        requirements: newEligibility.requirements 
      }]);
      setNewEligibility({ courseType: "", requirements: "" });
    }
  };

  const removeEligibility = (id: string) => {
    setEligibilityCriteria(eligibilityCriteria.filter(e => e.id !== id));
  };

  const updateEligibility = (id: string, field: 'courseType' | 'requirements', value: string) => {
    setEligibilityCriteria(eligibilityCriteria.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const addDocument = () => {
    if (newDocument.trim()) {
      setDocuments([...documents, { id: Date.now().toString(), name: newDocument }]);
      setNewDocument("");
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  const updateDocument = (id: string, value: string) => {
    setDocuments(documents.map(d => 
      d.id === id ? { ...d, name: value } : d
    ));
  };

  const addFeeStructure = () => {
    if (newFee.courseType.trim() && newFee.feeRange.trim()) {
      setFeeStructures([...feeStructures, { 
        id: Date.now().toString(), 
        courseType: newFee.courseType, 
        feeRange: newFee.feeRange 
      }]);
      setNewFee({ courseType: "", feeRange: "" });
    }
  };

  const removeFeeStructure = (id: string) => {
    setFeeStructures(feeStructures.filter(f => f.id !== id));
  };

  const updateFeeStructure = (id: string, field: 'courseType' | 'feeRange', value: string) => {
    setFeeStructures(feeStructures.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const addTimeline = () => {
    if (newTimeline.courseType.trim() && newTimeline.event.trim() && newTimeline.timeline.trim()) {
      setAdmissionTimelines([...admissionTimelines, { 
        id: Date.now().toString(), 
        courseType: newTimeline.courseType, 
        event: newTimeline.event, 
        timeline: newTimeline.timeline 
      }]);
      setNewTimeline({ courseType: "", event: "", timeline: "" });
    }
  };

  const removeTimeline = (id: string) => {
    setAdmissionTimelines(admissionTimelines.filter(t => t.id !== id));
  };

  const updateTimeline = (id: string, field: 'courseType' | 'event' | 'timeline', value: string) => {
    setAdmissionTimelines(admissionTimelines.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Admission & Eligibility</h3>
          <p className="text-sm text-gray-600 mt-1">Complete admission process, eligibility criteria, and fee structure</p>
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
        {/* Admission Process Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Admission Process (Short Steps)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {admissionSteps.sort((a, b) => a.stepNumber - b.stepNumber).map((step) => (
              <div key={step.id} className="border p-4 rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={step.stepNumber}
                        onChange={(e) => updateAdmissionStep(step.id, 'stepNumber', parseInt(e.target.value))}
                        disabled={!isEditing}
                        placeholder="#"
                        className="w-16 font-bold"
                      />
                      <Input
                        value={step.title}
                        onChange={(e) => updateAdmissionStep(step.id, 'title', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Step title"
                        className="font-medium flex-1"
                      />
                    </div>
                    <Textarea
                      value={step.description}
                      onChange={(e) => updateAdmissionStep(step.id, 'description', e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="Step description"
                    />
                  </div>
                  {isEditing && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeAdmissionStep(step.id)}
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
                    value={newStep.stepNumber || ""}
                    onChange={(e) => setNewStep({ ...newStep, stepNumber: parseInt(e.target.value) || 0 })}
                    placeholder="#"
                    className="w-16"
                  />
                  <Input
                    value={newStep.title}
                    onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
                    placeholder="New step title"
                    className="flex-1"
                  />
                </div>
                <Textarea
                  value={newStep.description}
                  onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                  rows={3}
                  placeholder="Step description"
                />
                <Button onClick={addAdmissionStep} size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Eligibility Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-purple-600" />
              Eligibility Criteria (General)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {eligibilityCriteria.map((criteria) => (
              <div key={criteria.id} className="border p-4 rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={criteria.courseType}
                      onChange={(e) => updateEligibility(criteria.id, 'courseType', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Course type"
                      className="font-medium"
                    />
                    <Textarea
                      value={criteria.requirements}
                      onChange={(e) => updateEligibility(criteria.id, 'requirements', e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="Requirements"
                    />
                  </div>
                  {isEditing && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEligibility(criteria.id)}
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
                  value={newEligibility.courseType}
                  onChange={(e) => setNewEligibility({ ...newEligibility, courseType: e.target.value })}
                  placeholder="Course type"
                />
                <Textarea
                  value={newEligibility.requirements}
                  onChange={(e) => setNewEligibility({ ...newEligibility, requirements: e.target.value })}
                  rows={3}
                  placeholder="Requirements"
                />
                <Button onClick={addEligibility} size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Eligibility Criteria
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Required */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-green-600" />
              Documents Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.map((doc, index) => (
              <div key={doc.id} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 w-8">{index + 1}.</span>
                  <Input
                    value={doc.name}
                    onChange={(e) => updateDocument(doc.id, e.target.value)}
                    disabled={!isEditing}
                    placeholder="Document name"
                    className="flex-1"
                  />
                </div>
                {isEditing && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            {isEditing && (
              <div className="border-2 border-dashed p-3 rounded-lg flex items-center gap-2">
                <Input
                  value={newDocument}
                  onChange={(e) => setNewDocument(e.target.value)}
                  placeholder="New document name"
                  className="flex-1"
                />
                <Button onClick={addDocument} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-orange-600" />
              Fee Structure Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={formData.fee_structure_note}
                onChange={(e) => handleChange("fee_structure_note", e.target.value)}
                disabled={!isEditing}
                rows={2}
                placeholder="Fee structure note"
              />
            </div>
            
            {feeStructures.map((fee) => (
              <div key={fee.id} className="border p-3 rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      value={fee.courseType}
                      onChange={(e) => updateFeeStructure(fee.id, 'courseType', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Course type"
                    />
                    <Input
                      value={fee.feeRange}
                      onChange={(e) => updateFeeStructure(fee.id, 'feeRange', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Fee range"
                    />
                  </div>
                  {isEditing && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFeeStructure(fee.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {isEditing && (
              <div className="border-2 border-dashed p-3 rounded-lg space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    value={newFee.courseType}
                    onChange={(e) => setNewFee({ ...newFee, courseType: e.target.value })}
                    placeholder="Course type"
                  />
                  <Input
                    value={newFee.feeRange}
                    onChange={(e) => setNewFee({ ...newFee, feeRange: e.target.value })}
                    placeholder="Fee range"
                  />
                </div>
                <Button onClick={addFeeStructure} size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Fee Structure
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admission Timelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-red-600" />
              Admission Dates / Timelines (Approximate for 2025-26)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {admissionTimelines.map((timeline) => (
              <div key={timeline.id} className="border p-3 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      value={timeline.courseType}
                      onChange={(e) => updateTimeline(timeline.id, 'courseType', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Course type"
                    />
                    <Input
                      value={timeline.event}
                      onChange={(e) => updateTimeline(timeline.id, 'event', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Event"
                    />
                    <Input
                      value={timeline.timeline}
                      onChange={(e) => updateTimeline(timeline.id, 'timeline', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Timeline"
                    />
                  </div>
                  {isEditing && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeTimeline(timeline.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {isEditing && (
              <div className="border-2 border-dashed p-3 rounded-lg space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    value={newTimeline.courseType}
                    onChange={(e) => setNewTimeline({ ...newTimeline, courseType: e.target.value })}
                    placeholder="Course type (UG/PG)"
                  />
                  <Input
                    value={newTimeline.event}
                    onChange={(e) => setNewTimeline({ ...newTimeline, event: e.target.value })}
                    placeholder="Event"
                  />
                  <Input
                    value={newTimeline.timeline}
                    onChange={(e) => setNewTimeline({ ...newTimeline, timeline: e.target.value })}
                    placeholder="Timeline"
                  />
                </div>
                <Button onClick={addTimeline} size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Timeline
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Portal Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LinkIcon className="h-5 w-5 text-teal-600" />
              Application Portal Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>UG Courses Portal</Label>
              <Input
                value={formData.ug_portal_link}
                onChange={(e) => handleChange("ug_portal_link", e.target.value)}
                disabled={!isEditing}
                placeholder="UG application portal URL"
              />
              <p className="text-xs text-gray-500">For UG courses: Centralized portal of the Directorate of Higher Education, Haryana</p>
            </div>
            <div className="space-y-2">
              <Label>PG Courses Portal</Label>
              <Input
                value={formData.pg_portal_link}
                onChange={(e) => handleChange("pg_portal_link", e.target.value)}
                disabled={!isEditing}
                placeholder="PG application portal URL"
              />
              <p className="text-xs text-gray-500">For PG courses: Available on the RKSD College website</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {admissionData && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(admissionData.updated_at || Date.now()).toLocaleString()}
        </div>
      )}
    </div>
  );
}
