import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Copy, ExternalLink, X, Eye, EyeOff, RotateCcw, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ClassEntry {
  className: string;
  location: string;
}

interface Department {
  id: string;
  name: string;
  slug: string;
  department_id: string;
  head_name?: string;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
  panel_link: string;
  is_active: boolean;
  created_at: string;
}

function parseMeta(description?: string) {
  if (!description) return {};
  try { return JSON.parse(description); } catch { return { notes: description }; }
}

export function DepartmentsManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    head_name: "",
    contact_email: "",
    contact_phone: "",
    qualification: "",
    stream: "",
    subjects: "",
    notes: "",
  });
  const [classEntries, setClassEntries] = useState<ClassEntry[]>([{ className: "", location: "" }]);
  const [newCredentials, setNewCredentials] = useState<any>(null);
  const [viewingCredentials, setViewingCredentials] = useState<any>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: departmentsData } = useQuery({
    queryKey: ['/api/head-admin/departments'],
    queryFn: async () => {
      const res = await fetch('/api/head-admin/departments');
      if (!res.ok) throw new Error('Failed to fetch departments');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/head-admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create mini panel');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/head-admin/departments'] });
      setNewCredentials(data.credentials);
      setFormData({ name: "", head_name: "", contact_email: "", contact_phone: "", qualification: "", stream: "", subjects: "", notes: "" });
      setClassEntries([{ className: "", location: "" }]);
      toast({ title: "Success", description: "Mini Panel created successfully! Save the credentials shown below." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/head-admin/departments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete mini panel');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/head-admin/departments'] });
      toast({ title: "Success", description: "Mini Panel deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const viewCredentials = async (id: string) => {
    try {
      const res = await fetch(`/api/head-admin/departments/${id}/credentials`);
      if (!res.ok) throw new Error('Failed to fetch credentials');
      const data = await res.json();
      setViewingCredentials({ ...data, _uuid: id });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/head-admin/departments/${id}/reset-password`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset password');
      return res.json();
    },
    onSuccess: (data) => {
      setViewingCredentials(data);
      toast({ title: "Password Reset", description: "New credentials ready. Save them now!" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Panel Name is required", variant: "destructive" });
      return;
    }
    const meta = JSON.stringify({
      qualification: formData.qualification,
      stream: formData.stream,
      subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
      classes: classEntries.filter(c => c.className.trim()),
      notes: formData.notes,
    });
    createMutation.mutate({
      name: formData.name.trim(),
      head_name: formData.head_name.trim() || undefined,
      contact_email: formData.contact_email.trim() || undefined,
      contact_phone: formData.contact_phone.trim() || undefined,
      description: meta,
    });
  };

  const addClassEntry = () => setClassEntries(prev => [...prev, { className: "", location: "" }]);
  const removeClassEntry = (idx: number) => setClassEntries(prev => prev.filter((_, i) => i !== idx));
  const updateClassEntry = (idx: number, field: keyof ClassEntry, value: string) => {
    setClassEntries(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
  };

  const departments: Department[] = departmentsData?.departments || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mini Panels</h2>
          <p className="text-gray-600 mt-1">Create panels for individual teachers to manage their timetable & data</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setNewCredentials(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create Mini Panel</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Mini Panel</DialogTitle>
              <DialogDescription>Create a panel for a teacher to manage their timetable, notices, and data</DialogDescription>
            </DialogHeader>

            {newCredentials ? (
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900">⚠️ Save these credentials! They won't be shown again.</div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Panel ID</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={newCredentials.department_id} readOnly className="bg-white" />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(newCredentials.department_id, "Panel ID")}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Password</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={newCredentials.password} readOnly className="bg-white" />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(newCredentials.password, "Password")}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Panel Link</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={`${window.location.origin}${newCredentials.panel_link}`} readOnly className="bg-white" />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(`${window.location.origin}${newCredentials.panel_link}`, "Panel Link")}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
                <Button onClick={() => { setNewCredentials(null); setIsCreateOpen(false); }} className="w-full">Done</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Panel Name *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Mr. Sharma - Yoga & Athletics" required />
                  </div>
                  <div>
                    <Label htmlFor="head_name">Teacher Name</Label>
                    <Input id="head_name" value={formData.head_name} onChange={(e) => setFormData({ ...formData, head_name: e.target.value })} placeholder="Dr. Raj Kumar" />
                  </div>
                  <div>
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input id="qualification" value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} placeholder="M.P.Ed, Ph.D" />
                  </div>
                  <div>
                    <Label htmlFor="stream">Stream / Specialization</Label>
                    <Input id="stream" value={formData.stream} onChange={(e) => setFormData({ ...formData, stream: e.target.value })} placeholder="Athletics, Yoga" />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">Phone</Label>
                    <Input id="contact_phone" value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="+91-XXXXXXXXXX" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="contact_email">Email</Label>
                    <Input id="contact_email" type="text" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} placeholder="teacher@rksd.edu" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="subjects">Subjects (comma separated)</Label>
                    <Input id="subjects" value={formData.subjects} onChange={(e) => setFormData({ ...formData, subjects: e.target.value })} placeholder="Physical Fitness, Health Education, Sports Science" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Classes & Duty Location</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addClassEntry}><Plus className="h-3 w-3 mr-1" />Add Class</Button>
                  </div>
                  <div className="space-y-2">
                    {classEntries.map((entry, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input placeholder="Class (e.g., B.P.Ed 1st Year)" value={entry.className} onChange={(e) => updateClassEntry(idx, 'className', e.target.value)} className="flex-1" />
                        <Input placeholder="Location (e.g., Ground A, Gym)" value={entry.location} onChange={(e) => updateClassEntry(idx, 'location', e.target.value)} className="flex-1" />
                        {classEntries.length > 1 && (
                          <Button type="button" size="icon" variant="ghost" onClick={() => removeClassEntry(idx)}><X className="h-4 w-4 text-red-500" /></Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any other relevant information..." rows={2} />
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Mini Panel"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const meta = parseMeta(dept.description);
          return (
            <Card key={dept.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="truncate">{dept.name}</span>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    <Button size="sm" variant="ghost" onClick={() => viewCredentials(dept.id)} title="View Credentials">
                      <KeyRound className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => window.open('/mini-panel', '_blank')} title="Open Panel">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(dept.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>ID: {dept.department_id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 text-sm">
                  {dept.head_name && <div><span className="font-medium text-gray-700">Teacher:</span> {dept.head_name}</div>}
                  {meta.qualification && <div><span className="font-medium text-gray-700">Qualification:</span> {meta.qualification}</div>}
                  {meta.stream && <div><span className="font-medium text-gray-700">Stream:</span> {meta.stream}</div>}
                  {meta.subjects && meta.subjects.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Subjects:</span>{' '}
                      <span className="text-gray-600">{Array.isArray(meta.subjects) ? meta.subjects.join(', ') : meta.subjects}</span>
                    </div>
                  )}
                  {meta.classes && meta.classes.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700 block mb-1">Classes & Duty:</span>
                      <div className="space-y-0.5 pl-2">
                        {meta.classes.filter((c: ClassEntry) => c.className).map((c: ClassEntry, i: number) => (
                          <div key={i} className="text-xs text-gray-600">
                            📍 <span className="font-medium">{c.className}</span>{c.location ? ` — ${c.location}` : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {dept.contact_phone && <div><span className="font-medium text-gray-700">Phone:</span> {dept.contact_phone}</div>}
                  <div className="pt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${dept.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {departments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No mini panels created yet. Click "Create Mini Panel" to get started.
          </CardContent>
        </Card>
      )}

      {/* Credentials Dialog */}
      {viewingCredentials && (
        <Dialog open={!!viewingCredentials} onOpenChange={() => setViewingCredentials(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Panel Credentials — {viewingCredentials.name}</DialogTitle>
              <DialogDescription>These are the login details for this mini panel.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div>
                <Label className="text-sm font-medium">Login URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={`${window.location.origin}/mini-panel`} readOnly className="bg-white text-sm" />
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/mini-panel`); toast({ title: "Copied!" }); }}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Panel ID</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={viewingCredentials.department_id} readOnly className="bg-white font-mono text-sm" />
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(viewingCredentials.department_id); toast({ title: "Copied!" }); }}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Password</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={viewingCredentials.password}
                    readOnly
                    type={showPasswords[viewingCredentials.department_id] ? "text" : "password"}
                    className="bg-white font-mono text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={() => setShowPasswords(p => ({ ...p, [viewingCredentials.department_id]: !p[viewingCredentials.department_id] }))}>
                    {showPasswords[viewingCredentials.department_id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(viewingCredentials.password); toast({ title: "Copied!" }); }}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full text-orange-600 border-orange-300 hover:bg-orange-50"
                onClick={() => {
                  if (confirm("Reset password? Old password will no longer work.")) {
                    resetPasswordMutation.mutate(viewingCredentials._uuid);
                  }
                }}
                disabled={resetPasswordMutation.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
            <Button onClick={() => setViewingCredentials(null)} className="w-full">Done</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
