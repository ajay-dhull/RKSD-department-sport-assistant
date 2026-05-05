import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Save, Edit, Plus, Trash2, Award, FileText, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

interface AdmissionScholarshipSectionProps {
  data: any;
  onUpdate: () => void;
}

interface Scholarship {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  amount: string;
}

export function AdmissionScholarshipSection({ data, onUpdate }: AdmissionScholarshipSectionProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    admission_process: "",
    required_documents: "",
    eligibility_criteria: "",
    admission_start_date: "",
    admission_end_date: "",
    counselling_date: "",
    fee_structure_pdf_url: "",
  });

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [newScholarship, setNewScholarship] = useState({ name: "", description: "", eligibility: "", amount: "" });
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingScholarship, setIsAddingScholarship] = useState(false);

  const { data: admissionData } = useQuery({
    queryKey: ["/api/admin/general-info/admission-scholarship"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/admission-scholarship", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (admissionData) {
      setFormData({
        admission_process: admissionData.admission_process || "",
        required_documents: admissionData.required_documents || "",
        eligibility_criteria: admissionData.eligibility_criteria || "",
        admission_start_date: admissionData.admission_start_date || "",
        admission_end_date: admissionData.admission_end_date || "",
        counselling_date: admissionData.counselling_date || "",
        fee_structure_pdf_url: admissionData.fee_structure_pdf_url || "",
      });
      setScholarships(admissionData.scholarships || []);
    }
  }, [admissionData]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/general-info/admission-scholarship", {
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
      toast({ title: "Success", description: "Admission & scholarship info updated successfully" });
      setIsEditing(false);
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ ...formData, scholarships });
  };

  const handleAddScholarship = () => {
    if (!newScholarship.name || !newScholarship.description) {
      toast({ title: "Error", description: "Name and description are required", variant: "destructive" });
      return;
    }
    const scholarship: Scholarship = {
      id: Date.now().toString(),
      ...newScholarship,
    };
    setScholarships([...scholarships, scholarship]);
    setNewScholarship({ name: "", description: "", eligibility: "", amount: "" });
    setIsAddingScholarship(false);
    toast({ title: "Success", description: "Scholarship added" });
  };

  const handleUpdateScholarship = () => {
    if (!editingScholarship) return;
    setScholarships(scholarships.map((s) => (s.id === editingScholarship.id ? editingScholarship : s)));
    setEditingScholarship(null);
    toast({ title: "Success", description: "Scholarship updated" });
  };

  const handleDeleteScholarship = (id: string) => {
    setScholarships(scholarships.filter((s) => s.id !== id));
    toast({ title: "Success", description: "Scholarship removed" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Admission & Scholarship</h3>
          <p className="text-sm text-gray-600 mt-1">Manage admission process and scholarship programs</p>
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

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Admission Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admission_process">Admission Process Overview *</Label>
              <Textarea
                id="admission_process"
                value={formData.admission_process}
                onChange={(e) => setFormData({ ...formData, admission_process: e.target.value })}
                disabled={!isEditing}
                placeholder="Describe the admission process step by step..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="required_documents">Required Documents *</Label>
              <Textarea
                id="required_documents"
                value={formData.required_documents}
                onChange={(e) => setFormData({ ...formData, required_documents: e.target.value })}
                disabled={!isEditing}
                placeholder="List all required documents (one per line or comma separated)..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eligibility_criteria">Eligibility Criteria *</Label>
              <Textarea
                id="eligibility_criteria"
                value={formData.eligibility_criteria}
                onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                disabled={!isEditing}
                placeholder="Describe eligibility requirements for admission..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admission_start_date">Admission Start Date</Label>
                <Input
                  id="admission_start_date"
                  type="date"
                  value={formData.admission_start_date}
                  onChange={(e) => setFormData({ ...formData, admission_start_date: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admission_end_date">Admission End Date</Label>
                <Input
                  id="admission_end_date"
                  type="date"
                  value={formData.admission_end_date}
                  onChange={(e) => setFormData({ ...formData, admission_end_date: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="counselling_date">Counselling Date</Label>
                <Input
                  id="counselling_date"
                  type="date"
                  value={formData.counselling_date}
                  onChange={(e) => setFormData({ ...formData, counselling_date: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Fee Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fee_structure_pdf_url">Fee Structure PDF URL</Label>
              <Input
                id="fee_structure_pdf_url"
                value={formData.fee_structure_pdf_url}
                onChange={(e) => setFormData({ ...formData, fee_structure_pdf_url: e.target.value })}
                disabled={!isEditing}
                placeholder="https://example.com/fee-structure.pdf"
              />
              <p className="text-xs text-gray-500">
                Upload your fee structure PDF to a cloud service and paste the link here
              </p>
            </div>
            {formData.fee_structure_pdf_url && (
              <a
                href={formData.fee_structure_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:underline"
              >
                <FileText className="h-4 w-4 mr-1" />
                View Fee Structure PDF
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />
              Scholarship Programs
            </CardTitle>
            {isEditing && (
              <Dialog open={isAddingScholarship} onOpenChange={setIsAddingScholarship}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Scholarship Program</DialogTitle>
                    <DialogDescription>Add a new scholarship available at your college</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Scholarship Name *</Label>
                      <Input
                        value={newScholarship.name}
                        onChange={(e) => setNewScholarship({ ...newScholarship, name: e.target.value })}
                        placeholder="e.g., Merit Scholarship"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description *</Label>
                      <Textarea
                        value={newScholarship.description}
                        onChange={(e) => setNewScholarship({ ...newScholarship, description: e.target.value })}
                        placeholder="Brief description of the scholarship..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Eligibility</Label>
                      <Input
                        value={newScholarship.eligibility}
                        onChange={(e) => setNewScholarship({ ...newScholarship, eligibility: e.target.value })}
                        placeholder="e.g., 85% or above in 12th"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount/Benefit</Label>
                      <Input
                        value={newScholarship.amount}
                        onChange={(e) => setNewScholarship({ ...newScholarship, amount: e.target.value })}
                        placeholder="e.g., ₹50,000 per year"
                      />
                    </div>
                    <Button onClick={handleAddScholarship} className="w-full">
                      Add Scholarship
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {scholarships.length > 0 ? (
              <div className="space-y-3">
                {scholarships.map((scholarship) => (
                  <div key={scholarship.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-600" />
                          {scholarship.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{scholarship.description}</p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          {scholarship.eligibility && (
                            <span className="text-xs text-gray-500">
                              <span className="font-medium">Eligibility:</span> {scholarship.eligibility}
                            </span>
                          )}
                          {scholarship.amount && (
                            <span className="text-xs text-green-700 font-medium">
                              {scholarship.amount}
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
                                onClick={() => setEditingScholarship(scholarship)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Scholarship</DialogTitle>
                              </DialogHeader>
                              {editingScholarship && editingScholarship.id === scholarship.id && (
                                <div className="space-y-4 mt-4">
                                  <div className="space-y-2">
                                    <Label>Name *</Label>
                                    <Input
                                      value={editingScholarship.name}
                                      onChange={(e) => setEditingScholarship({ ...editingScholarship, name: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Description *</Label>
                                    <Textarea
                                      value={editingScholarship.description}
                                      onChange={(e) => setEditingScholarship({ ...editingScholarship, description: e.target.value })}
                                      rows={3}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Eligibility</Label>
                                    <Input
                                      value={editingScholarship.eligibility}
                                      onChange={(e) => setEditingScholarship({ ...editingScholarship, eligibility: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Amount/Benefit</Label>
                                    <Input
                                      value={editingScholarship.amount}
                                      onChange={(e) => setEditingScholarship({ ...editingScholarship, amount: e.target.value })}
                                    />
                                  </div>
                                  <Button onClick={handleUpdateScholarship} className="w-full">
                                    Update Scholarship
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteScholarship(scholarship.id)}
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No scholarship programs added yet</p>
              </div>
            )}
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
