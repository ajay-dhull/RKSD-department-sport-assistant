import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Save, Users, Building, Trash2, Plus } from "lucide-react";

interface AdministrationManagementSectionProps {
  data: any;
  onUpdate: () => void;
}

interface DepartmentHead {
  id: string;
  department: string;
  headName: string;
}

interface Committee {
  id: string;
  name: string;
  description: string;
}

export function AdministrationManagementSection({ data, onUpdate }: AdministrationManagementSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    principal_name: "Dr. Rajbir Parashar",
    principal_designation: "Principal",
    principal_tenure_start: "August 1, 2025",
    principal_predecessor: "Dr. Satyabir Singh Mehla",
    principal_contact: "01746-222368",
    principal_email: "principal@rksdcollege.ac.in",
    
    chairman_name: "Sh. Ashwani Shorewala",
    chairman_role: "Under the visionary leadership of Sh. Ashwani Shorewala, the college has evolved into a centre of excellence where tradition harmoniously blends with modern educational practices.",
    
    organizational_structure: "The college operates under the Rashtriya Vidya Samiti (RVS), Kaithal, a registered charitable society. The administrative structure includes various committees and departments that ensure smooth functioning and adherence to academic and administrative standards.",
    
    administrative_staff_description: "The administrative wing of the college comprises various staff members who handle day-to-day operations, including admissions, accounts, student services, and general administration. They work under the guidance of the Principal and the Governing Body to ensure the smooth functioning of the institution.",
  });

  const [committees, setCommittees] = useState<Committee[]>([
    {
      id: "1",
      name: "Internal Quality Assurance Cell (IQAC)",
      description: "Focuses on enhancing the quality of education and institutional performance."
    },
    {
      id: "2",
      name: "Admission Committee",
      description: "Oversees the admission process, ensuring transparency and adherence to university guidelines."
    },
    {
      id: "3",
      name: "Disciplinary Committee",
      description: "Maintains discipline and decorum within the campus."
    },
    {
      id: "4",
      name: "Examination Committee",
      description: "Handles all matters related to internal and external examinations."
    },
    {
      id: "5",
      name: "Grievance Redressal Cell",
      description: "Addresses and resolves grievances of students and staff."
    },
    {
      id: "6",
      name: "Anti-Ragging Committee",
      description: "Ensures a ragging-free environment on campus."
    },
    {
      id: "7",
      name: "Women's Cell",
      description: "Promotes gender equality and addresses issues related to women."
    },
    {
      id: "8",
      name: "NSS (National Service Scheme)",
      description: "Encourages students to participate in community service and social welfare activities."
    },
    {
      id: "9",
      name: "NCC (National Cadet Corps)",
      description: "Instills discipline and leadership qualities among students."
    }
  ]);

  const [departmentHeads, setDepartmentHeads] = useState<DepartmentHead[]>([
    { id: "1", department: "English", headName: "Dr. Rajbir Parashar" },
    { id: "2", department: "Chemistry", headName: "Dr. Shilpy Aggarwal" },
    { id: "3", department: "Botany", headName: "Dr. Sushil Gupta" },
    { id: "4", department: "Commerce", headName: "Mr. Ajay Sharma" },
    { id: "5", department: "Economics", headName: "Dr. Suraj Walia" },
    { id: "6", department: "Electronics", headName: "Mr. Rajesh Deshwal" },
    { id: "7", department: "Geography", headName: "Mr. Raghbir Singh" },
    { id: "8", department: "Physics", headName: "Dr. Alisha Goyal" },
    { id: "9", department: "Computer Science", headName: "Dr. Matish Garg" },
    { id: "10", department: "Physical Education", headName: "Dr. Gurdeep Bhola" },
    { id: "11", department: "Political Science", headName: "Sh. Shriom" },
    { id: "12", department: "Zoology", headName: "Dr. Gagan Mittal" },
    { id: "13", department: "Hindi", headName: "Dr. R. P. Moun" },
    { id: "14", department: "History", headName: "Dr. Rakesh Mittal" },
    { id: "15", department: "Mathematics", headName: "Dr. Satyabir Mehla" },
    { id: "16", department: "Sanskrit", headName: "Dr. Laxmi Mor" },
    { id: "17", department: "Punjabi", headName: "Ms. Sheenu Singla" },
    { id: "18", department: "Library", headName: "Dr. Naresh Kumar" }
  ]);

  const [newCommittee, setNewCommittee] = useState({ name: "", description: "" });
  const [newDepartmentHead, setNewDepartmentHead] = useState({ department: "", headName: "" });
  const [isEditing, setIsEditing] = useState(false);

  const { data: administrationData } = useQuery({
    queryKey: ["/api/admin/general-info/administration-management"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/administration-management", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (administrationData) {
      setFormData({
        principal_name: administrationData.principal_name || formData.principal_name,
        principal_designation: administrationData.principal_designation || formData.principal_designation,
        principal_tenure_start: administrationData.principal_tenure_start || formData.principal_tenure_start,
        principal_predecessor: administrationData.principal_predecessor || formData.principal_predecessor,
        principal_contact: administrationData.principal_contact || formData.principal_contact,
        principal_email: administrationData.principal_email || formData.principal_email,
        chairman_name: administrationData.chairman_name || formData.chairman_name,
        chairman_role: administrationData.chairman_role || formData.chairman_role,
        organizational_structure: administrationData.organizational_structure || formData.organizational_structure,
        administrative_staff_description: administrationData.administrative_staff_description || formData.administrative_staff_description,
      });
      if (administrationData.committees) {
        setCommittees(administrationData.committees);
      }
      if (administrationData.department_heads) {
        setDepartmentHeads(administrationData.department_heads);
      }
    }
  }, [administrationData]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/general-info/administration-management", {
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
      toast({ title: "Success", description: "Administration/Management information updated successfully" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info/administration-management"] });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...formData,
      committees,
      department_heads: departmentHeads,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addCommittee = () => {
    if (newCommittee.name.trim()) {
      setCommittees([...committees, { 
        id: Date.now().toString(), 
        name: newCommittee.name, 
        description: newCommittee.description 
      }]);
      setNewCommittee({ name: "", description: "" });
    }
  };

  const removeCommittee = (id: string) => {
    setCommittees(committees.filter(c => c.id !== id));
  };

  const addDepartmentHead = () => {
    if (newDepartmentHead.department.trim() && newDepartmentHead.headName.trim()) {
      setDepartmentHeads([...departmentHeads, { 
        id: Date.now().toString(), 
        department: newDepartmentHead.department, 
        headName: newDepartmentHead.headName 
      }]);
      setNewDepartmentHead({ department: "", headName: "" });
    }
  };

  const removeDepartmentHead = (id: string) => {
    setDepartmentHeads(departmentHeads.filter(d => d.id !== id));
  };

  const updateDepartmentHead = (id: string, field: 'department' | 'headName', value: string) => {
    setDepartmentHeads(departmentHeads.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const updateCommittee = (id: string, field: 'name' | 'description', value: string) => {
    setCommittees(committees.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Administration / Management</h3>
          <p className="text-sm text-gray-600 mt-1">Principal, Governing Body, Committees, and Department Heads</p>
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
        {/* Principal Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-blue-600" />
              Principal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.principal_name}
                  onChange={(e) => handleChange("principal_name", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Principal's name"
                />
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input
                  value={formData.principal_designation}
                  onChange={(e) => handleChange("principal_designation", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Designation"
                />
              </div>
              <div className="space-y-2">
                <Label>Tenure Start</Label>
                <Input
                  value={formData.principal_tenure_start}
                  onChange={(e) => handleChange("principal_tenure_start", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Tenure start date"
                />
              </div>
              <div className="space-y-2">
                <Label>Predecessor</Label>
                <Input
                  value={formData.principal_predecessor}
                  onChange={(e) => handleChange("principal_predecessor", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Previous principal"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <Input
                  value={formData.principal_contact}
                  onChange={(e) => handleChange("principal_contact", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Contact number"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={formData.principal_email}
                  onChange={(e) => handleChange("principal_email", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Email address"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Governing Body Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="h-5 w-5 text-purple-600" />
              Governing Body
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Chairman Name</Label>
              <Input
                value={formData.chairman_name}
                onChange={(e) => handleChange("chairman_name", e.target.value)}
                disabled={!isEditing}
                placeholder="Chairman's name"
              />
            </div>
            <div className="space-y-2">
              <Label>Chairman's Role & Description</Label>
              <Textarea
                value={formData.chairman_role}
                onChange={(e) => handleChange("chairman_role", e.target.value)}
                disabled={!isEditing}
                rows={3}
                placeholder="Description of chairman's role and leadership"
              />
            </div>
          </CardContent>
        </Card>

        {/* Organizational Structure Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="h-5 w-5 text-green-600" />
              Organizational Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={formData.organizational_structure}
                onChange={(e) => handleChange("organizational_structure", e.target.value)}
                disabled={!isEditing}
                rows={4}
                placeholder="Organizational structure description"
              />
            </div>
          </CardContent>
        </Card>

        {/* Key Administrative Committees Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-orange-600" />
              Key Administrative Committees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {committees.map((committee) => (
              <div key={committee.id} className="border p-4 rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={committee.name}
                      onChange={(e) => updateCommittee(committee.id, 'name', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Committee name"
                      className="font-medium"
                    />
                    <Textarea
                      value={committee.description}
                      onChange={(e) => updateCommittee(committee.id, 'description', e.target.value)}
                      disabled={!isEditing}
                      rows={2}
                      placeholder="Committee description"
                    />
                  </div>
                  {isEditing && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCommittee(committee.id)}
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
                  value={newCommittee.name}
                  onChange={(e) => setNewCommittee({ ...newCommittee, name: e.target.value })}
                  placeholder="New committee name"
                />
                <Textarea
                  value={newCommittee.description}
                  onChange={(e) => setNewCommittee({ ...newCommittee, description: e.target.value })}
                  rows={2}
                  placeholder="Committee description"
                />
                <Button onClick={addCommittee} size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Committee
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Heads Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-red-600" />
              Department Heads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {departmentHeads.map((head) => (
                <div key={head.id} className="border p-3 rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={head.department}
                        onChange={(e) => updateDepartmentHead(head.id, 'department', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Department"
                        className="text-sm font-medium"
                      />
                      <Input
                        value={head.headName}
                        onChange={(e) => updateDepartmentHead(head.id, 'headName', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Head of Department"
                        className="text-sm"
                      />
                    </div>
                    {isEditing && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeDepartmentHead(head.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {isEditing && (
              <div className="border-2 border-dashed p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    value={newDepartmentHead.department}
                    onChange={(e) => setNewDepartmentHead({ ...newDepartmentHead, department: e.target.value })}
                    placeholder="Department name"
                  />
                  <Input
                    value={newDepartmentHead.headName}
                    onChange={(e) => setNewDepartmentHead({ ...newDepartmentHead, headName: e.target.value })}
                    placeholder="Head of Department name"
                  />
                </div>
                <Button onClick={addDepartmentHead} size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department Head
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Administrative Staff Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-teal-600" />
              Administrative Staff
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={formData.administrative_staff_description}
                onChange={(e) => handleChange("administrative_staff_description", e.target.value)}
                disabled={!isEditing}
                rows={4}
                placeholder="Administrative staff description"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {administrationData && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(administrationData.updated_at || Date.now()).toLocaleString()}
        </div>
      )}
    </div>
  );
}
