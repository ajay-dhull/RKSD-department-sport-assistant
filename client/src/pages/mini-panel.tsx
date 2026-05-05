import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut, Plus, Trash2, Edit2, Clock, Bell, BookOpen,
  Calendar, MapPin, User, Upload, FileText, X,
  CheckCircle, AlertCircle, Info, Megaphone, Loader2,
  GraduationCap, LayoutDashboard
} from "lucide-react";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SHIFTS = ["Morning","Evening"];
const SEMESTERS = ["1st Sem","2nd Sem","3rd Sem","4th Sem","5th Sem","6th Sem"];
const UPDATE_TYPES = [
  { value: "class_timing", label: "Class Timing", icon: Clock,       color: "#3b82f6", bg: "#eff6ff" },
  { value: "notice",       label: "Notice",       icon: AlertCircle, color: "#f59e0b", bg: "#fffbeb" },
  { value: "event",        label: "Event",        icon: Calendar,    color: "#8b5cf6", bg: "#f5f3ff" },
  { value: "general",      label: "General",      icon: Info,        color: "#10b981", bg: "#f0fdf4" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    timeZone:"Asia/Kolkata", day:"2-digit", month:"short",
    year:"numeric", hour:"2-digit", minute:"2-digit"
  });
}

const emptyClass = {
  course_name:"", shift:"Morning", year:"1", semester:"1st Sem",
  section:"A", day_of_week:"Monday", start_time:"09:00",
  end_time:"10:00", room_number:"", teacher_name:"", subject:""
};

export default function MiniPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [isLoggedIn,    setIsLoggedIn]    = useState(false);
  const [deptInfo,      setDeptInfo]      = useState<any>(null);
  const [token,         setToken]         = useState<string|null>(null);
  const [loginForm,     setLoginForm]     = useState({ department_id:"", password:"" });
  const [loginLoading,  setLoginLoading]  = useState(false);
  const [activeTab,     setActiveTab]     = useState<"classes"|"updates">("classes");

  const [classDialog,   setClassDialog]   = useState(false);
  const [editingClass,  setEditingClass]  = useState<any>(null);
  const [classForm,     setClassForm]     = useState(emptyClass);

  const [updateDialog,  setUpdateDialog]  = useState(false);
  const [updateForm,    setUpdateForm]    = useState({ title:"", content:"", update_type:"general" });
  const [selectedFile,  setSelectedFile]  = useState<File|null>(null);
  const [previewUrl,    setPreviewUrl]    = useState<string|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = localStorage.getItem("mini_panel_token");
    const d = localStorage.getItem("mini_panel_dept");
    if (t && d) { setToken(t); setDeptInfo(JSON.parse(d)); setIsLoggedIn(true); }
  }, []);

  const ah = token ? { Authorization:`Bearer ${token}` } : {};

  const { data: classesData, refetch: refetchClasses } = useQuery<{ schedules:any[] }>({
    queryKey: ["mini-classes", deptInfo?.id],
    enabled: !!deptInfo?.id && isLoggedIn,
    queryFn: () => fetch(`/api/department/${deptInfo.id}/class-schedules`, { headers: ah }).then(r => r.json()),
  });

  const { data: updatesData, refetch: refetchUpdates } = useQuery<{ updates:any[] }>({
    queryKey: ["mini-updates", deptInfo?.id],
    enabled: !!deptInfo?.id && isLoggedIn,
    queryFn: () => fetch(`/api/department/${deptInfo.id}/updates`, { headers: ah }).then(r => r.json()),
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.department_id.trim() || !loginForm.password.trim()) {
      toast({ title:"Error", description:"Panel ID and Password required", variant:"destructive" }); return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch("/api/department/login", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(loginForm),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Invalid credentials"); }
      const data = await res.json();
      setToken(data.token); setDeptInfo(data.department); setIsLoggedIn(true);
      localStorage.setItem("mini_panel_token", data.token);
      localStorage.setItem("mini_panel_dept", JSON.stringify(data.department));
      toast({ title:"Welcome!", description:`Logged in as ${data.department.name}` });
    } catch (err:any) {
      toast({ title:"Login Failed", description:err.message, variant:"destructive" });
    } finally { setLoginLoading(false); }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setDeptInfo(null); setToken(null);
    localStorage.removeItem("mini_panel_token");
    localStorage.removeItem("mini_panel_dept");
  };

  const saveClass = useMutation({
    mutationFn: async (data: any) => {
      const section = `${data.section}${data.semester ? ` (${data.semester})` : ""}`;
      const { semester: _sem, ...rest } = data;
      const url = editingClass
        ? `/api/department/class-schedules/${editingClass.id}`
        : `/api/department/${deptInfo.id}/class-schedules`;
      const res = await fetch(url, {
        method: editingClass ? "PUT" : "POST",
        headers:{"Content-Type":"application/json",...ah},
        body: JSON.stringify({ ...rest, section, year: parseInt(data.year) }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Failed to save"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title:"Saved!", description:"Class schedule updated" });
      setClassDialog(false); setEditingClass(null); setClassForm(emptyClass);
      refetchClasses();
    },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const deleteClass = useMutation({
    mutationFn: async (id:string) => {
      const res = await fetch(`/api/department/class-schedules/${id}`, { method:"DELETE", headers:ah });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => { toast({ title:"Deleted" }); refetchClasses(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const postUpdate = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("title", updateForm.title.trim());
      fd.append("content", updateForm.content.trim());
      fd.append("update_type", updateForm.update_type);
      if (selectedFile) fd.append("file", selectedFile);
      const res = await fetch(`/api/department/${deptInfo.id}/updates`, { method:"POST", headers:ah, body:fd });
      if (!res.ok) throw new Error("Failed to post");
      return res.json();
    },
    onSuccess: () => {
      toast({ title:"Posted!", description:"Update sent to all subscribers" });
      setUpdateDialog(false);
      setUpdateForm({ title:"", content:"", update_type:"general" });
      setSelectedFile(null); setPreviewUrl(null);
      refetchUpdates();
    },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const deleteUpdate = useMutation({
    mutationFn: async (id:string) => {
      const res = await fetch(`/api/department/${deptInfo.id}/updates/${id}`, { method:"DELETE", headers:ah });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => { toast({ title:"Deleted" }); refetchUpdates(); },
    onError: (e:any) => toast({ title:"Error", description:e.message, variant:"destructive" }),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10*1024*1024) { toast({ title:"Too large", description:"Max 10 MB", variant:"destructive" }); return; }
    setSelectedFile(file);
    setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
  };

  const openEditClass = (cls:any) => {
    const secParts = (cls.section || "A").split(" (");
    setEditingClass(cls);
    setClassForm({
      course_name: cls.course_name || "",
      shift: cls.shift || "Morning",
      year: String(cls.year || "1"),
      semester: secParts[1]?.replace(")","") || "1st Sem",
      section: secParts[0] || "A",
      day_of_week: cls.day_of_week || "Monday",
      start_time: cls.start_time || "09:00",
      end_time: cls.end_time || "10:00",
      room_number: cls.room_number || "",
      teacher_name: cls.teacher_name || "",
      subject: cls.subject || "",
    });
    setClassDialog(true);
  };

  const classes  = classesData?.schedules || [];
  const updates  = updatesData?.updates   || [];
  const byDay    = DAYS.reduce((a,d) => { a[d] = classes.filter(c => c.day_of_week === d); return a; }, {} as any);

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (!isLoggedIn) return (
    <div className="min-h-screen w-full flex items-center justify-center"
      style={{ background:"linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#4f46e5 100%)" }}>
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage:"radial-gradient(circle,white 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
      <div className="relative w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-2xl"
            style={{ background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)" }}>
            <GraduationCap size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Teacher Panel</h1>
          <p className="text-blue-200 text-sm mt-1">RKSD College — Physical Education</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background:"rgba(255,255,255,0.97)", border:"1px solid rgba(255,255,255,0.5)" }}>
          <div className="px-7 py-8">
            <h2 className="font-bold text-slate-800 mb-1">Welcome back</h2>
            <p className="text-slate-400 text-xs mb-6">Enter your credentials to continue</p>
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Panel ID</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" placeholder="e.g. DEPT-ABCD1234"
                    value={loginForm.department_id}
                    onChange={e => setLoginForm(p => ({...p, department_id: e.target.value}))}
                    className="w-full h-11 pl-9 pr-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    style={{ border:"1.5px solid #e5e7eb" }}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Password</label>
                <input
                  type="password" placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={e => setLoginForm(p => ({...p, password: e.target.value}))}
                  className="w-full h-11 px-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  style={{ border:"1.5px solid #e5e7eb" }}
                />
              </div>
              <button type="submit" disabled={loginLoading}
                className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 mt-2"
                style={{ background: loginLoading ? "#93c5fd" : "linear-gradient(135deg,#1e40af,#4f46e5)", boxShadow:"0 4px 14px rgba(30,64,175,0.35)" }}>
                {loginLoading ? <><Loader2 size={16} className="animate-spin" /> Logging in...</> : "Login →"}
              </button>
            </form>
            <p className="text-xs text-slate-400 text-center mt-5">Credentials provided by Head Admin</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full" style={{ background:"#f1f5f9" }}>

      {/* Header */}
      <header className="sticky top-0 z-20 w-full"
        style={{ background:"linear-gradient(135deg,#1e3a8a,#1d4ed8)", boxShadow:"0 2px 20px rgba(30,58,138,0.25)" }}>
        <div className="w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:"rgba(255,255,255,0.15)" }}>
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">{deptInfo?.name}</p>
              <p className="text-blue-200 text-xs">ID: {deptInfo?.department_id}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
            style={{ background:"rgba(255,255,255,0.12)", color:"#e0e7ff", border:"1px solid rgba(255,255,255,0.2)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}>
            <LogOut size={13} /> Logout
          </button>
        </div>

        {/* Tab bar */}
        <div className="w-full px-4 flex gap-1 pb-3">
          {[
            { key:"classes", label:"Class Schedule", icon:Clock,    count:classes.length },
            { key:"updates", label:"Updates",         icon:Megaphone,count:updates.length },
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: active ? "rgba(255,255,255,0.2)" : "transparent",
                  color: active ? "white" : "rgba(255,255,255,0.6)",
                  border: active ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent"
                }}>
                <Icon size={14} /> {t.label}
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)", color:"white" }}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="w-full px-4 py-5">

        {/* ── CLASS SCHEDULE TAB ──────────────────────────────────────────── */}
        {activeTab === "classes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800">Class Schedule</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage your weekly timetable</p>
              </div>
              <button
                onClick={() => { setClassForm(emptyClass); setEditingClass(null); setClassDialog(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
                style={{ background:"linear-gradient(135deg,#1e40af,#4f46e5)", boxShadow:"0 3px 10px rgba(30,64,175,0.3)" }}>
                <Plus size={15} /> Add Class
              </button>
            </div>

            {classes.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed py-14 text-center"
                style={{ borderColor:"#e2e8f0" }}>
                <Clock size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium text-sm">No classes added yet</p>
                <p className="text-slate-400 text-xs mt-1">Click "Add Class" to create your schedule</p>
              </div>
            ) : (
              <div className="space-y-3">
                {DAYS.filter(d => byDay[d]?.length > 0).map(day => (
                  <div key={day} className="bg-white rounded-2xl overflow-hidden shadow-sm"
                    style={{ border:"1px solid #e2e8f0" }}>
                    <div className="px-4 py-2.5 flex items-center gap-2"
                      style={{ background:"linear-gradient(135deg,#1e3a8a,#2563eb)" }}>
                      <Calendar size={13} className="text-blue-200" />
                      <span className="text-white font-bold text-sm">{day}</span>
                      <span className="ml-auto text-xs text-blue-200 font-medium">{byDay[day].length} class{byDay[day].length>1?"es":""}</span>
                    </div>
                    <div className="divide-y" style={{ divideColor:"#f1f5f9" }}>
                      {byDay[day]
                        .sort((a:any,b:any) => a.start_time.localeCompare(b.start_time))
                        .map((cls:any) => (
                          <div key={cls.id} className="px-4 py-3 flex items-start justify-between group"
                            style={{ transition:"background 0.15s" }}
                            onMouseEnter={e => (e.currentTarget.style.background="#f8fafc")}
                            onMouseLeave={e => (e.currentTarget.style.background="")}>
                            <div className="flex items-start gap-3">
                              <div className="rounded-xl p-2 mt-0.5 flex-shrink-0" style={{ background:"#eff6ff" }}>
                                <Clock size={13} style={{ color:"#2563eb" }} />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{cls.course_name}</p>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500">
                                  <span>🕐 {cls.start_time} – {cls.end_time}</span>
                                  {cls.subject && <span>📖 {cls.subject}</span>}
                                  {cls.room_number && <span><MapPin size={10} className="inline mr-0.5" />{cls.room_number}</span>}
                                  {cls.teacher_name && <span><User size={10} className="inline mr-0.5" />{cls.teacher_name}</span>}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background:"#dbeafe", color:"#1d4ed8" }}>
                                    Year {cls.year}
                                  </span>
                                  {cls.section && (
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background:"#f0fdf4", color:"#16a34a" }}>
                                      {cls.section}
                                    </span>
                                  )}
                                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background:"#faf5ff", color:"#7c3aed" }}>
                                    {cls.shift}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditClass(cls)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                style={{ background:"#eff6ff", color:"#2563eb" }}>
                                <Edit2 size={13} />
                              </button>
                              <button onClick={() => deleteClass.mutate(cls.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                style={{ background:"#fff1f2", color:"#e11d48" }}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── UPDATES TAB ─────────────────────────────────────────────────── */}
        {activeTab === "updates" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800">Updates & Notices</h2>
                <p className="text-xs text-slate-400 mt-0.5">Visible to students · sent via email</p>
              </div>
              <button
                onClick={() => { setUpdateForm({title:"",content:"",update_type:"general"}); setSelectedFile(null); setPreviewUrl(null); setUpdateDialog(true); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
                style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow:"0 3px 10px rgba(124,58,237,0.3)" }}>
                <Plus size={15} /> Post Update
              </button>
            </div>

            {updates.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed py-14 text-center"
                style={{ borderColor:"#e2e8f0" }}>
                <Megaphone size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium text-sm">No updates posted yet</p>
                <p className="text-slate-400 text-xs mt-1">Post class timing changes, notices or announcements</p>
              </div>
            ) : (
              <div className="space-y-3">
                {updates.map((upd:any) => {
                  const cfg = UPDATE_TYPES.find(t => t.value === upd.update_type) || UPDATE_TYPES[3];
                  const Icon = cfg.icon;
                  const isPdf = upd.file_type === "application/pdf";
                  const isImg = upd.file_type?.startsWith("image/");
                  return (
                    <div key={upd.id} className="bg-white rounded-2xl shadow-sm overflow-hidden group"
                      style={{ border:"1px solid #e2e8f0" }}>
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl p-2 flex-shrink-0" style={{ background:cfg.bg }}>
                            <Icon size={15} style={{ color:cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background:cfg.bg, color:cfg.color }}>
                                {cfg.label}
                              </span>
                              {upd.email_sent && (
                                <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                                  <CheckCircle size={10} /> Sent
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400 ml-auto">{formatDate(upd.created_at)}</span>
                            </div>
                            <p className="font-semibold text-slate-800 text-sm">{upd.title}</p>
                            <p className="text-slate-600 text-sm mt-1 whitespace-pre-wrap leading-relaxed">{upd.content}</p>
                            {upd.file_url && (
                              <div className="mt-2">
                                {isImg ? (
                                  <img src={upd.file_url} alt={upd.file_name}
                                    className="rounded-xl max-h-48 object-cover border"
                                    style={{ borderColor:"#e2e8f0" }} />
                                ) : isPdf ? (
                                  <a href={upd.file_url} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                    style={{ background:"#eff6ff", color:"#2563eb", border:"1px solid #bfdbfe" }}>
                                    <FileText size={12} /> {upd.file_name}
                                  </a>
                                ) : null}
                              </div>
                            )}
                          </div>
                          <button onClick={() => deleteUpdate.mutate(upd.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background:"#fff1f2", color:"#e11d48" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CLASS DIALOG ──────────────────────────────────────────────────── */}
      <Dialog open={classDialog} onOpenChange={v => { setClassDialog(v); if (!v) { setEditingClass(null); setClassForm(emptyClass); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveClass.mutate(classForm); }} className="space-y-3" noValidate>

            {/* Course name */}
            <div>
              <Label className="text-xs font-semibold text-slate-600">Course / Class Name *</Label>
              <Input className="mt-1 text-sm" placeholder="e.g. B.P.Ed 1st Year"
                value={classForm.course_name}
                onChange={e => setClassForm(p => ({...p, course_name: e.target.value}))} required />
            </div>

            {/* Day + Shift */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Day</Label>
                <select className="w-full h-10 rounded-lg px-3 text-sm border mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={classForm.day_of_week}
                  onChange={e => setClassForm(p => ({...p, day_of_week: e.target.value}))}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Shift</Label>
                <select className="w-full h-10 rounded-lg px-3 text-sm border mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={classForm.shift}
                  onChange={e => setClassForm(p => ({...p, shift: e.target.value}))}>
                  {SHIFTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Start Time</Label>
                <Input type="time" className="mt-1 text-sm" value={classForm.start_time}
                  onChange={e => setClassForm(p => ({...p, start_time: e.target.value}))} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">End Time</Label>
                <Input type="time" className="mt-1 text-sm" value={classForm.end_time}
                  onChange={e => setClassForm(p => ({...p, end_time: e.target.value}))} />
              </div>
            </div>

            {/* Year + Semester */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Year</Label>
                <select className="w-full h-10 rounded-lg px-3 text-sm border mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={classForm.year}
                  onChange={e => setClassForm(p => ({...p, year: e.target.value}))}>
                  {["1","2","3","4","5","6"].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Semester</Label>
                <select className="w-full h-10 rounded-lg px-3 text-sm border mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={classForm.semester}
                  onChange={e => setClassForm(p => ({...p, semester: e.target.value}))}>
                  {SEMESTERS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Section + Subject */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Section</Label>
                <Input className="mt-1 text-sm" placeholder="A" value={classForm.section}
                  onChange={e => setClassForm(p => ({...p, section: e.target.value}))} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Subject</Label>
                <Input className="mt-1 text-sm" placeholder="Physical Fitness"
                  value={classForm.subject}
                  onChange={e => setClassForm(p => ({...p, subject: e.target.value}))} />
              </div>
            </div>

            {/* Room + Teacher */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Room / Location</Label>
                <Input className="mt-1 text-sm" placeholder="Ground A / Room 12"
                  value={classForm.room_number}
                  onChange={e => setClassForm(p => ({...p, room_number: e.target.value}))} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Teacher Name</Label>
                <Input className="mt-1 text-sm" placeholder="Dr. Raj Kumar"
                  value={classForm.teacher_name}
                  onChange={e => setClassForm(p => ({...p, teacher_name: e.target.value}))} />
              </div>
            </div>

            <button type="submit" disabled={saveClass.isPending || !classForm.course_name}
              className="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              style={{ background:"linear-gradient(135deg,#1e40af,#4f46e5)" }}>
              {saveClass.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : (editingClass ? "Update Class" : "Add Class")}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── UPDATE DIALOG ───────────────────────────────────────────────── */}
      <Dialog open={updateDialog} onOpenChange={v => { setUpdateDialog(v); if (!v) { setSelectedFile(null); setPreviewUrl(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Post Update</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!updateForm.title.trim() || !updateForm.content.trim()) {
                toast({ title:"Required", description:"Title and content needed", variant:"destructive" }); return;
              }
              postUpdate.mutate();
            }}
            className="space-y-4" noValidate>

            {/* Type selector */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-2">Update Type</label>
              <div className="grid grid-cols-2 gap-2">
                {UPDATE_TYPES.map(t => {
                  const Icon = t.icon;
                  const sel = updateForm.update_type === t.value;
                  return (
                    <button key={t.value} type="button"
                      onClick={() => setUpdateForm(p => ({...p, update_type: t.value}))}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                      style={{
                        background: sel ? t.bg : "white",
                        borderColor: sel ? t.color : "#e5e7eb",
                        color: sel ? t.color : "#6b7280"
                      }}>
                      <Icon size={14} /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Title *</label>
              <Input className="text-sm" placeholder="e.g. Class Timing Changed for Monday"
                value={updateForm.title}
                onChange={e => setUpdateForm(p => ({...p, title: e.target.value}))} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Details *</label>
              <Textarea rows={4} className="text-sm resize-none" placeholder="Describe the update in detail..."
                value={updateForm.content}
                onChange={e => setUpdateForm(p => ({...p, content: e.target.value}))} />
            </div>

            {/* File */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Attachment (optional)</label>
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ background:"#f8fafc", borderColor:"#e2e8f0" }}>
                  {previewUrl
                    ? <img src={previewUrl} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:"#fee2e2" }}>
                        <FileText size={18} style={{ color:"#ef4444" }} />
                      </div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-slate-800">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400">{(selectedFile.size/1024).toFixed(0)} KB</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background:"#fee2e2", color:"#ef4444" }}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed rounded-xl p-4 text-center transition-all"
                  style={{ borderColor:"#e2e8f0", background:"#f8fafc" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor="#3b82f6"; e.currentTarget.style.background="#eff6ff"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.background="#f8fafc"; }}>
                  <Upload size={18} className="mx-auto text-slate-400 mb-1" />
                  <p className="text-sm text-slate-500 font-medium">Click to attach image or PDF</p>
                  <p className="text-xs text-slate-400 mt-0.5">Max 10 MB</p>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileSelect} />
            </div>

            <div className="flex items-start gap-2 rounded-xl p-3" style={{ background:"#eff6ff", border:"1px solid #bfdbfe" }}>
              <Bell size={13} style={{ color:"#2563eb", marginTop:2, flexShrink:0 }} />
              <p className="text-xs" style={{ color:"#1d4ed8" }}>
                This update will be <strong>emailed to all subscribers</strong> and visible on the department website.
              </p>
            </div>

            <button type="submit" disabled={postUpdate.isPending}
              className="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
              {postUpdate.isPending
                ? <><Loader2 size={14} className="animate-spin" /> Posting...</>
                : <><Megaphone size={14} /> Post Update & Notify Students</>}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
