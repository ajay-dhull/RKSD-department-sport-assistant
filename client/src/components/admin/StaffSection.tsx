import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useVoice } from "@/hooks/use-voice";
import { Plus, Edit, Trash2, Mail, Phone, Sparkles, ChevronDown, Users, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EnhancedAIInput } from "./EnhancedAIInput";
import { EnhancedAIPreview } from "./EnhancedAIPreview";
import { SmartAIUpdatePreview } from "./SmartAIUpdatePreview";

interface StaffMember {
  id: string;
  full_name: string;
  employee_id: string;
  department_id: string;
  role: string;
  designation: string;
  email: string;
  phone: string;
  qualification: string;
  specialization: string;
  joining_date: string;
  is_active: boolean;
}

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  qualification: "",
  specialization: "",
};

export function StaffSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null);
  const [smartAIResponse, setSmartAIResponse] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [formData, setFormData] = useState(emptyForm);

  const token = localStorage.getItem("adminToken");

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    browserSupported,
  } = useVoice();

  const { data: staffData } = useQuery<{ staff: StaffMember[] }>({
    queryKey: ["/api/admin/staff"],
    queryFn: async () => {
      const res = await fetch("/api/admin/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch staff");
      return await res.json();
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('staff-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_members' }, () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add staff member");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
      toast({ title: "Success", description: "Staff member added successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update staff member");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
      toast({ title: "Success", description: "Staff member updated successfully" });
      setEditingStaff(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete staff member");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
      toast({ title: "Success", description: "Staff member removed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (transcript && isAiMode) setAiPrompt(transcript);
  }, [transcript, isAiMode]);

  const handleToggleVoice = () => {
    if (isListening) stopListening();
    else startListening(aiPrompt);
  };

  const handleRegenerateAI = () => {
    setAiGeneratedData(null);
    setSmartAIResponse(null);
    setCurrentPreviewIndex(0);
  };

  const handleCancelSmartAI = () => {
    setSmartAIResponse(null);
    setAiGeneratedData(null);
    setAiPrompt("");
    setCurrentPreviewIndex(0);
    resetTranscript();
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: "Error", description: "Please enter a description or use voice input", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const updateKeywords = ['change', 'update', 'modify', 'kar do', 'badlo', 'edit', 'correct', 'fix'];
      const isUpdateIntent = updateKeywords.some(k => aiPrompt.toLowerCase().includes(k));

      if (isUpdateIntent) {
        const res = await fetch("/api/admin/ai-smart-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ prompt: aiPrompt, sectionType: 'staff' }),
        });
        if (!res.ok) throw new Error("Failed to generate");
        const data = await res.json();
        setSmartAIResponse(data);
        toast({ title: "Success", description: data.operation === 'update' ? "Update detected! Review changes." : "Generated successfully!" });
      } else {
        const res = await fetch("/api/admin/ai-generate-staff", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ prompt: aiPrompt }),
        });
        if (!res.ok) throw new Error("Failed to generate");
        const data = await res.json();
        setAiGeneratedData(data);
        toast({ title: "Success", description: "Staff info generated!" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmAI = async () => {
    try {
      if (smartAIResponse && smartAIResponse.operation === 'update') {
        const matchedEntry = smartAIResponse.matched_entry;
        const changes = smartAIResponse.changes;
        if (!matchedEntry?.id) throw new Error("No entry found to update");
        const updatedData: any = { ...matchedEntry };
        for (const [fieldName, change] of Object.entries(changes)) {
          updatedData[fieldName] = (change as any).new;
        }
        const cleanedData: any = {
          full_name: updatedData.full_name || '',
          employee_id: updatedData.employee_id || '',
          role: updatedData.role || '',
          designation: updatedData.designation || '',
          email: updatedData.email || '',
          phone: updatedData.phone || '',
          qualification: updatedData.qualification || '',
          specialization: updatedData.specialization || '',
          joining_date: updatedData.joining_date || '',
        };
        if (updatedData.department_id?.trim()) cleanedData.department_id = updatedData.department_id;

        const res = await fetch(`/api/admin/staff/${matchedEntry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(cleanedData),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update");
        }
        await queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
        toast({ title: "Success", description: "Staff member updated!" });
      } else if (aiGeneratedData) {
        const entries = aiGeneratedData.entries || [aiGeneratedData];
        for (const entry of entries) {
          const cleanedEntry: any = { ...entry };
          if (!cleanedEntry.department_id?.trim()) delete cleanedEntry.department_id;
          const res = await fetch("/api/admin/staff", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(cleanedEntry),
          });
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to add: ${entry.full_name}`);
          }
        }
        await queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
        toast({ title: "Success", description: `${entries.length} staff member(s) added!` });
      }
      setAiPrompt(""); setAiGeneratedData(null); setSmartAIResponse(null);
      setCurrentPreviewIndex(0); setIsAiMode(false); setIsCreateOpen(false);
      resetTranscript();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditEntry = (entry: any) => {
    setFormData({
      full_name: entry.full_name || "",
      email: entry.email || "",
      phone: entry.phone || "",
      qualification: entry.qualification || "",
      specialization: entry.specialization || "",
    });
    setAiGeneratedData(null); setCurrentPreviewIndex(0); setIsAiMode(false);
  };

  const handleDeleteEntry = (index: number) => {
    if (!aiGeneratedData) return;
    const entries = (aiGeneratedData.entries || [aiGeneratedData]).filter((_: any, i: number) => i !== index);
    if (entries.length === 0) {
      setAiGeneratedData(null); setCurrentPreviewIndex(0);
    } else {
      setAiGeneratedData({ entries });
      if (currentPreviewIndex >= entries.length) setCurrentPreviewIndex(entries.length - 1);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setAiPrompt(""); setAiGeneratedData(null); setCurrentPreviewIndex(0); resetTranscript();
  };

  const handleOpenDialog = (mode: 'manual' | 'ai') => {
    setIsAiMode(mode === 'ai');
    setIsCreateOpen(true);
    setAiPrompt(""); setAiGeneratedData(null); setCurrentPreviewIndex(0); resetTranscript();
  };

  const handleSubmit = () => {
    const payload = { ...formData };
    if (editingStaff) {
      updateMutation.mutate({ id: editingStaff.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const startEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      full_name: staff.full_name,
      email: staff.email || "",
      phone: staff.phone || "",
      qualification: staff.qualification || "",
      specialization: staff.specialization || "",
    });
  };

  const allStaff = staffData?.staff || [];
  // HOD always at top, rest below
  const hodEntry = allStaff.find((m) => m.role === 'HOD');
  const otherStaff = allStaff.filter((m) => m.role !== 'HOD');
  const staff = hodEntry ? [hodEntry, ...otherStaff] : otherStaff;

  const formFields = (
    <div className="space-y-4">
      <div>
        <Label>Full Name *</Label>
        <Input
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          placeholder="e.g., Dr. Rajesh Kumar"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Email</Label>
          <Input
            type="text"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="email@example.com"
          />
        </div>
        <div>
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+91-XXXXXXXXXX"
          />
        </div>
      </div>
      <div>
        <Label>Qualification</Label>
        <Input
          value={formData.qualification}
          onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
          placeholder="e.g., M.P.Ed., Ph.D."
        />
      </div>
      <div>
        <Label>Specialization</Label>
        <Textarea
          value={formData.specialization}
          onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
          placeholder="Area of expertise..."
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Staff Detail</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage department staff members</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenDialog('manual')}>Manual Mode</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenDialog('ai')}>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Mode (Smart Add)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {isAiMode ? "AI Mode - Add Staff Member" : "Add Staff Member"}
            </DialogTitle>
          </DialogHeader>
          {isAiMode ? (
            <>
              {!aiGeneratedData && !smartAIResponse ? (
                <EnhancedAIInput
                  prompt={aiPrompt}
                  onPromptChange={setAiPrompt}
                  onGenerate={handleGenerateAI}
                  isGenerating={isGenerating}
                  isListening={isListening}
                  onToggleVoice={handleToggleVoice}
                  browserSupported={browserSupported}
                  placeholder="Add or update staff (e.g., 'Add Dr. Ajay Kumar, M.P.Ed., phone 9876543210')..."
                  examples={[
                    "Add Dr. Rajesh Kumar, M.P.Ed. qualification, phone 9876543210",
                    "Update Dr. Kumar's phone to 9999888877",
                    "Add three staff: Prof. Sharma, Dr. Verma, Ms. Patel"
                  ]}
                  sectionType="staff members"
                />
              ) : smartAIResponse ? (
                <SmartAIUpdatePreview
                  operation={smartAIResponse.operation}
                  confidence={smartAIResponse.confidence}
                  matched_entry={smartAIResponse.matched_entry}
                  changes={smartAIResponse.changes}
                  entries={smartAIResponse.entries}
                  explanation={smartAIResponse.explanation}
                  sectionType="staff"
                  onConfirm={handleConfirmAI}
                  onRegenerate={handleRegenerateAI}
                  onCancel={handleCancelSmartAI}
                  renderPreview={(s) => (
                    <div className="space-y-2">
                      <p className="font-semibold">{s.full_name}</p>
                      {s.email && <p className="text-sm text-gray-600">{s.email}</p>}
                      {s.phone && <p className="text-sm text-gray-600">{s.phone}</p>}
                      {s.qualification && <p className="text-sm text-gray-600">{s.qualification}</p>}
                    </div>
                  )}
                />
              ) : (
                <EnhancedAIPreview
                  entries={aiGeneratedData.entries || [aiGeneratedData]}
                  currentIndex={currentPreviewIndex}
                  onIndexChange={setCurrentPreviewIndex}
                  renderPreview={(s) => (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="font-semibold text-gray-700 block mb-1">Name:</span>
                          <p className="text-gray-900 text-lg">{s.full_name}</p>
                        </div>
                        {s.qualification && (
                          <div>
                            <span className="font-semibold text-gray-700 block mb-1">Qualification:</span>
                            <p className="text-gray-900">{s.qualification}</p>
                          </div>
                        )}
                        {s.email && (
                          <div>
                            <span className="font-semibold text-gray-700 block mb-1">Email:</span>
                            <p className="text-gray-900">{s.email}</p>
                          </div>
                        )}
                        {s.phone && (
                          <div>
                            <span className="font-semibold text-gray-700 block mb-1">Phone:</span>
                            <p className="text-gray-900">{s.phone}</p>
                          </div>
                        )}
                        {s.specialization && (
                          <div className="col-span-2">
                            <span className="font-semibold text-gray-700 block mb-1">Specialization:</span>
                            <p className="text-gray-900">{s.specialization}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  onConfirmAll={handleConfirmAI}
                  onRegenerate={handleRegenerateAI}
                  onEditEntry={handleEditEntry}
                  onDeleteEntry={handleDeleteEntry}
                  confirmButtonText={`Add ${(aiGeneratedData.entries || [aiGeneratedData]).length} Staff Member${(aiGeneratedData.entries || [aiGeneratedData]).length > 1 ? 's' : ''}`}
                  entryTypeName="Staff Member"
                />
              )}
            </>
          ) : (
            <div>
              {formFields}
              <Button onClick={handleSubmit} className="w-full mt-4" disabled={!formData.full_name || createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Staff Member"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingStaff} onOpenChange={(open) => !open && setEditingStaff(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Staff Member</DialogTitle>
          </DialogHeader>
          {formFields}
          <Button onClick={handleSubmit} className="w-full mt-4" disabled={!formData.full_name || updateMutation.isPending}>
            {updateMutation.isPending ? "Updating..." : "Update Staff Member"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Staff List */}
      {staff.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">No staff members added yet</p>
            <p className="text-gray-400 text-sm">Click "Add Staff" to add your first staff member</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Qualification</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Specialization</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {staff.map((member) => {
                    const isHOD = member.role === 'HOD';
                    return (
                    <tr key={member.id} className={isHOD ? "bg-amber-50 hover:bg-amber-100 transition-colors border-l-4 border-amber-400" : "hover:bg-gray-50 transition-colors"}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isHOD && <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{member.full_name}</p>
                            {isHOD && (
                              <Badge className="mt-0.5 text-xs bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">
                                Head of Department
                              </Badge>
                            )}
                            {!isHOD && member.designation && (
                              <p className="text-xs text-gray-500 mt-0.5">{member.designation}</p>
                            )}
                            {/* Mobile: show contact inline */}
                            <div className="sm:hidden mt-1 space-y-0.5">
                              {member.email && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="h-3 w-3" />{member.email}</p>}
                              {member.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" />{member.phone}</p>}
                              {member.qualification && <p className="text-xs text-gray-500">{member.qualification}</p>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="space-y-1">
                          {member.email && (
                            <p className="text-sm text-gray-600 flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              {member.email}
                            </p>
                          )}
                          {member.phone && (
                            <p className="text-sm text-gray-600 flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              {member.phone}
                            </p>
                          )}
                          {!member.email && !member.phone && <span className="text-xs text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-sm text-gray-700">{member.qualification || <span className="text-gray-400">—</span>}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm text-gray-600 max-w-xs truncate">{member.specialization || <span className="text-gray-400">—</span>}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(member)}
                            className="hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {!isHOD && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteMutation.mutate(member.id)}
                              className="hover:bg-red-50 hover:border-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
