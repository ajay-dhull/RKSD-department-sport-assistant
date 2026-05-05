import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Bell, Trash2, Send, Users, Mail, CheckCircle, X,
  FileText, Upload, Clock, AlertCircle, Calendar, Info,
  Megaphone, Loader2, Eye, RotateCcw
} from "lucide-react";

const UPDATE_TYPES = [
  { value: "general", label: "General Update", icon: Info },
  { value: "class_timing", label: "Class Timing", icon: Clock },
  { value: "notice", label: "Notice", icon: AlertCircle },
  { value: "event", label: "Event", icon: Calendar },
];

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export function UpdatesAdminSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeView, setActiveView] = useState<"updates" | "subscribers" | "email">("updates");
  const [form, setForm] = useState({ title: "", content: "", update_type: "general" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");

  const { data: updatesData, refetch: refetchUpdates } = useQuery<{ updates: any[] }>({
    queryKey: ["/api/updates"],
    queryFn: () => fetch("/api/updates?limit=50").then(r => r.json()),
  });

  const { data: subscribersData, refetch: refetchSubs } = useQuery<{ subscribers: any[] }>({
    queryKey: ["/api/head-admin/subscribers"],
    queryFn: () => fetch("/api/head-admin/subscribers").then(r => r.json()),
    enabled: activeView === "subscribers",
  });

  const postUpdate = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("content", form.content.trim());
      fd.append("update_type", form.update_type);
      if (selectedFile) fd.append("file", selectedFile);
      const res = await fetch("/api/head-admin/updates", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Posted!", description: "Update sent to all subscribers" });
      setForm({ title: "", content: "", update_type: "general" });
      setSelectedFile(null);
      setPreviewUrl(null);
      refetchUpdates();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSub = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/head-admin/subscribers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => { toast({ title: "Removed" }); refetchSubs(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteUpdate = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/head-admin/updates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => { toast({ title: "Deleted", description: "Update removed" }); refetchUpdates(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sendTest = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/head-admin/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: (data) => toast({ title: data.success ? "Sent!" : "Failed", description: data.message }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast({ title: "Too large", description: "Max 10MB", variant: "destructive" }); return; }
    setSelectedFile(file);
    setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
  };

  const updates = updatesData?.updates || [];
  const subscribers = subscribersData?.subscribers || [];
  const activeCount = subscribers.filter((s: any) => s.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Updates & Subscribers</h2>
          <p className="text-gray-600 mt-1">Post updates and manage email notifications</p>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 border-b pb-0">
        {[
          { id: "updates", label: "Post Update", icon: Megaphone },
          { id: "subscribers", label: `Subscribers (${activeCount})`, icon: Users },
          { id: "email", label: "Email Config", icon: Mail },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeView === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── POST UPDATE ──────────────────────────────────────────────────── */}
      {activeView === "updates" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader><CardTitle className="text-base">New Update</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select value={form.update_type} onValueChange={v => setForm({ ...form, update_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UPDATE_TYPES.map(t => {
                      const Icon = t.icon;
                      return <SelectItem key={t.value} value={t.value}><div className="flex items-center gap-2"><Icon size={14} />{t.label}</div></SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title *</Label>
                <Input className="mt-1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Update title" />
              </div>
              <div>
                <Label>Content *</Label>
                <Textarea className="mt-1" rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Describe the update..." />
              </div>
              <div>
                <Label>Attachment (optional)</Label>
                <div className="mt-1">
                  {selectedFile ? (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border rounded-lg">
                      {previewUrl ? <img src={previewUrl} alt="" className="w-10 h-10 object-cover rounded" /> : <FileText size={20} className="text-red-500" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                        <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}><X size={16} className="text-gray-400 hover:text-red-500" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm text-gray-500">
                      <Upload size={18} className="mx-auto mb-1 text-gray-400" />
                      Image or PDF (max 10MB)
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileSelect} />
                </div>
              </div>
              <Button className="w-full" disabled={postUpdate.isPending || !form.title.trim() || !form.content.trim()}
                onClick={() => postUpdate.mutate()}>
                {postUpdate.isPending ? <><Loader2 size={14} className="animate-spin mr-2" />Sending...</> : <><Send size={14} className="mr-2" />Post & Email Subscribers</>}
              </Button>
            </CardContent>
          </Card>

          {/* Recent updates list */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700">Recent Updates ({updates.length})</h3>
            {updates.length === 0 ? (
              <Card className="border-dashed"><CardContent className="py-8 text-center text-gray-400 text-sm">No updates yet</CardContent></Card>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {updates.map((u: any) => (
                  <Card key={u.id} className="text-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">{u.update_type}</Badge>
                            {u.email_sent && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={10} />Sent</span>}
                            {u.departments?.name && <span className="text-xs text-gray-400">{u.departments.name}</span>}
                          </div>
                          <p className="font-medium text-gray-900 truncate">{u.title}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{formatDate(u.created_at)}</p>
                        </div>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => { if (confirm("Delete this update?")) deleteUpdate.mutate(u.id); }}
                          disabled={deleteUpdate.isPending}
                          className="flex-shrink-0"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUBSCRIBERS ──────────────────────────────────────────────────── */}
      {activeView === "subscribers" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
              <span className="font-semibold text-green-700">{activeCount}</span>
              <span className="text-green-600"> active subscribers</span>
            </div>
          </div>

          {subscribers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users size={36} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No subscribers yet</p>
                <p className="text-gray-400 text-sm">Students subscribe from the Updates page on the website</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="divide-y">
                {subscribers.map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${sub.is_active ? "bg-green-400" : "bg-gray-300"}`} />
                      <div>
                        <p className="font-medium text-sm text-gray-900">{sub.email}</p>
                        {sub.name && <p className="text-xs text-gray-500">{sub.name}</p>}
                        <p className="text-xs text-gray-400">Subscribed {formatDate(sub.subscribed_at)}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteSub.mutate(sub.id)}>
                      <Trash2 size={14} className="text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── EMAIL CONFIG ─────────────────────────────────────────────────── */}
      {activeView === "email" && (
        <div className="max-w-lg space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Email Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 space-y-2">
                <p className="font-semibold">Required Environment Variables:</p>
                <code className="block bg-white rounded p-2 text-xs font-mono">
                  EMAIL_USER=youremail@gmail.com<br />
                  EMAIL_PASS=your_app_password<br />
                  EMAIL_FROM_NAME=RKSD College Updates
                </code>
                <p className="text-xs text-blue-600">
                  Gmail App Password: Google Account → Security → 2-Step Verification → App passwords
                </p>
              </div>

              <div>
                <Label>Send Test Email</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="text"
                    placeholder="test@email.com"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                  />
                  <Button onClick={() => sendTest.mutate()} disabled={sendTest.isPending || !testEmail}>
                    {sendTest.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
