import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Bell, ArrowLeft, Clock, AlertCircle, Calendar, Info,
  FileText, CheckCircle, Loader2, ChevronDown, User, Mail,
  Instagram, Globe, Zap, BookOpen, Layers, Shield, Users
} from "lucide-react";
import { useLocation } from "wouter";

const UPDATE_TYPES: Record<string, {
  label: string; border: string; iconBg: string; textColor: string;
  pillBg: string; pillText: string; icon: any;
}> = {
  class_timing: { label: "Class Timing", border: "#2563eb", iconBg: "bg-blue-50",   textColor: "text-blue-600",   pillBg: "bg-blue-100",   pillText: "text-blue-700",   icon: Clock        },
  notice:       { label: "Notice",       border: "#f59e0b", iconBg: "bg-amber-50",  textColor: "text-amber-600",  pillBg: "bg-amber-100",  pillText: "text-amber-800",  icon: AlertCircle  },
  event:        { label: "Event",        border: "#8b5cf6", iconBg: "bg-violet-50", textColor: "text-violet-600", pillBg: "bg-violet-100", pillText: "text-violet-700", icon: Calendar     },
  general:      { label: "Update",       border: "#10b981", iconBg: "bg-emerald-50",textColor: "text-emerald-600",pillBg: "bg-emerald-100",pillText: "text-emerald-800",icon: Info         },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fullDate(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const INITIAL_SHOW = 4;

export default function UpdatesBoard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAll, setShowAll] = useState(false);
  const [subName, setSubName]         = useState("");
  const [subClass, setSubClass]       = useState("");
  const [subEmail, setSubEmail]       = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed]   = useState(false);

  const { data, isLoading, isError } = useQuery<{ updates: any[] }>({
    queryKey: ["public-updates"],
    queryFn: async () => {
      const r = await fetch("/api/updates?limit=50");
      if (!r.ok) throw new Error(`API error ${r.status}`);
      return r.json();
    },
    refetchInterval: 60000,
  });

  const allUpdates     = (data?.updates || []);
  const totalNotices   = allUpdates.filter(u => u.update_type === "notice").length;
  const totalEvents    = allUpdates.filter(u => u.update_type === "event").length;
  const visibleUpdates = showAll ? allUpdates : allUpdates.slice(0, INITIAL_SHOW);
  const hiddenCount    = allUpdates.length - INITIAL_SHOW;
  const lastUpdated    = allUpdates[0] ? timeAgo(allUpdates[0].created_at) : "—";

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subEmail)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subEmail.trim(), name: subName.trim(), class_info: subClass.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setSubscribed(true);
      toast({ title: "Subscribed!", description: "You'll receive email notifications for new updates" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ══════════════════════════════════════════════ NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 sm:px-10 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/")}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors mr-1"
          >
            <ArrowLeft size={16} className="text-slate-500" />
          </button>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
            <Layers size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900 leading-tight">Physical Education Dept.</p>
            <p className="text-xs text-slate-500">RKSD College, Kaithal</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live Updates
        </div>
      </nav>

      {/* ══════════════════════════════════════════════ HERO */}
      <section className="relative overflow-hidden w-full px-5 sm:px-10 py-14 sm:py-20"
        style={{ background: "linear-gradient(135deg,#0c1f5e 0%,#1a3aad 45%,#1d4ed8 75%,#2563eb 100%)" }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-5 bg-white" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full opacity-[0.04] bg-white" />
        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-5"
            style={{ background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.9)" }}>
            <Shield size={11} />
            RKSD College, Kaithal · Est. 1959
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-2">Physical Education</h1>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4" style={{ color: "#93c5fd" }}>Department</h1>
          <p className="text-base mb-10 max-w-lg" style={{ color: "#93c5fd", lineHeight: 1.7 }}>
            Your one-stop source for the latest updates, notices, events and announcements from the Physical Education Department.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            {[
              { val: String(allUpdates.length), lbl: "Total Updates", col: "#fff",    sub: "#bfdbfe" },
              { val: String(totalNotices),      lbl: "Notices",       col: "#fde68a", sub: "#fef3c7" },
              { val: String(totalEvents),       lbl: "Events",        col: "#a5f3fc", sub: "#cffafe" },
              { val: lastUpdated,               lbl: "Last Updated",  col: "#bbf7d0", sub: "#dcfce7", sm: true },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl text-center py-4 px-2"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <p className={`font-black leading-none ${s.sm ? "text-base mt-1" : "text-3xl"}`} style={{ color: s.col }}>{s.val}</p>
                <p className="text-[10px] font-bold mt-1.5 uppercase tracking-wide" style={{ color: s.sub }}>{s.lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ UPDATES */}
      <section className="w-full px-4 sm:px-10 py-12 sm:py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-7 pb-4 border-b-2 border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Bell size={22} className="text-blue-600" />
              Latest Updates
            </h2>
            <span className="text-xs font-bold px-4 py-1.5 rounded-full"
              style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
              {allUpdates.length} total updates
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center py-16 text-slate-400">
              <Loader2 className="animate-spin mb-3" size={30} />
              <p className="text-sm">Loading updates...</p>
            </div>
          ) : isError ? (
            <div className="bg-white border-2 border-dashed border-red-200 rounded-2xl py-16 text-center">
              <Bell size={40} className="mx-auto text-red-300 mb-3" />
              <p className="font-semibold text-red-500">Could not load updates</p>
              <p className="text-sm text-slate-400 mt-1">Please check your internet connection and try again</p>
            </div>
          ) : allUpdates.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-16 text-center">
              <Bell size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-500">No updates yet</p>
              <p className="text-sm text-slate-400 mt-1">Check back later for department announcements</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleUpdates.map((upd: any, idx: number) => {
                const cfg  = UPDATE_TYPES[upd.update_type] || UPDATE_TYPES.general;
                const Icon = cfg.icon;
                const isPdf = upd.file_type === "application/pdf";
                const isImg = upd.file_type?.startsWith("image/");
                return (
                  <div key={upd.id}
                    className={`bg-white rounded-r-2xl border border-slate-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
                    style={{ borderLeft: `5px solid ${cfg.border}` }}>
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                          <Icon size={18} className={cfg.textColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${cfg.pillBg} ${cfg.pillText}`}>
                              {cfg.label}
                            </span>
                            {idx === 0 && (
                              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-red-500 text-white animate-pulse">
                                NEW
                              </span>
                            )}
                            {upd.departments?.name && (
                              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                                {upd.departments.name}
                              </span>
                            )}
                            <span className="text-xs text-slate-400 ml-auto">{timeAgo(upd.created_at)}</span>
                          </div>
                          <p className="font-bold text-base text-slate-900 leading-snug">{upd.title}</p>
                          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed whitespace-pre-wrap">{upd.content}</p>
                          {upd.file_url && (
                            <div className="mt-3">
                              {isImg && (
                                <a href={upd.file_url} target="_blank" rel="noreferrer">
                                  <img src={upd.file_url} alt={upd.file_name}
                                    className="rounded-xl max-h-52 object-cover border border-slate-200 hover:opacity-90 transition-opacity" />
                                </a>
                              )}
                              {isPdf && (
                                <a href={upd.file_url} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:underline">
                                  <FileText size={12} /> {upd.file_name}
                                </a>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-2.5 pt-2.5 border-t border-slate-100">
                            {fullDate(upd.created_at)}{upd.posted_by ? ` · ${upd.posted_by}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!showAll && hiddenCount > 0 && (
                <button onClick={() => setShowAll(true)}
                  className="w-full py-4 flex items-center justify-center gap-2 text-sm font-bold rounded-2xl transition-all"
                  style={{ border: "2px dashed #c7d2fe", color: "#4338ca", background: "transparent" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#eef2ff"; e.currentTarget.style.borderColor = "#818cf8"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#c7d2fe"; }}>
                  <ChevronDown size={16} />
                  See {hiddenCount} more update{hiddenCount > 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════ ABOUT */}
      <section className="w-full px-4 sm:px-10 py-14 sm:py-20" style={{ background: "#f8fafc" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:grid md:gap-16 md:items-stretch gap-0"
            style={{ gridTemplateColumns: "1fr 1.2fr" }}>

            {/* LEFT: Photo */}
            <div className="relative mb-12 md:mb-0 flex flex-col">
              <div className="rounded-3xl overflow-hidden flex-1"
                style={{
                  background: "linear-gradient(135deg,#1e3a8a,#2563eb)",
                  boxShadow: "0 24px 60px rgba(37,99,235,0.22)",
                  minHeight: "300px"
                }}>
                <img src="/ajay.png" alt="Ajay Dhull"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                    el.parentElement!.innerHTML = `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:rgba(255,255,255,0.5)"><svg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1'><circle cx='12' cy='8' r='5'/><path d='M3 21c0-5 4-9 9-9s9 4 9 9'/></svg><span style='font-size:14px'>Ajay Dhull</span></div>`;
                  }}
                />
              </div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-white rounded-2xl px-4 py-2.5 flex items-center gap-2.5 whitespace-nowrap"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.10)", border: "1px solid #e2e8f0" }}>
                <Zap size={15} className="text-blue-600" />
                <span className="text-sm font-bold text-slate-900">Developer &amp; Creator</span>
              </div>
            </div>

            {/* RIGHT: Text */}
            <div className="pt-4 md:pt-0">
              <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-4"
                style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                <BookOpen size={11} />
                BSc Sports Science Student
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-1">Ajay Dhull</h3>
              <p className="text-base font-semibold text-blue-600 mb-5">Full-Stack Developer · AI Entrepreneur</p>
              <div className="w-12 h-1 rounded-full mb-6" style={{ background: "linear-gradient(90deg,#2563eb,#60a5fa)" }} />
              <p className="text-sm text-slate-600 mb-7" style={{ lineHeight: 1.85 }}>
                I'm <strong className="text-slate-900">Ajay Dhull</strong>, a BSc Sports Science student at RKSD College, Kaithal.
                I built this AI-powered department platform completely on my own — designed to give students,
                teachers and staff instant access to all updates, notices and events from the Physical Education
                Department, all in one modern place.
              </p>
              <div className="flex flex-wrap gap-2.5 mb-8">
                {["🎓 BSc Sports Science", "🏫 RKSD College, Kaithal", "💻 Full-Stack Developer", "⚡ AI-Powered Apps"].map(tag => (
                  <span key={tag} className="text-xs font-medium px-4 py-2 rounded-xl bg-white text-slate-600"
                    style={{ border: "1px solid #e2e8f0" }}>{tag}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="https://www.instagram.com/haryanvi__jaat_22?igsh=NDcxZHd5eG9nMjEx" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all no-underline"
                  style={{ background: "#fdf2f8", color: "#9d174d", border: "1px solid #f9a8d4" }}>
                  <Instagram size={15} />
                  Instagram
                </a>
                <a href="https://lightsalmon-mallard-505670.hostingersite.com/" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all no-underline"
                  style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                  <Globe size={15} />
                  My Portfolio
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ SUBSCRIBE */}
      <section className="w-full px-4 sm:px-10 py-14 sm:py-20 bg-white">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="relative overflow-hidden rounded-t-3xl px-6 sm:px-10 py-7 sm:py-9"
            style={{ background: "linear-gradient(135deg,#4c1d95 0%,#6d28d9 50%,#4338ca 100%)" }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
            <div className="relative flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <Bell size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-1">Never Miss an Update</h3>
                <p className="text-sm" style={{ color: "#c4b5fd", lineHeight: 1.6 }}>
                  Subscribe to get instant email notifications whenever a new notice, event or update is posted.
                </p>
              </div>
            </div>
          </div>

          {/* Form body */}
          <div className="rounded-b-3xl px-6 sm:px-10 py-7 sm:py-9 bg-white" style={{ border: "1px solid #e2e8f0", borderTop: "none" }}>
            {subscribed ? (
              <div className="flex items-center gap-4 rounded-2xl px-6 py-5"
                style={{ background: "#f0fdf4", border: "1.5px solid #86efac" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-100">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-base text-green-800">You're subscribed! 🎉</p>
                  <p className="text-sm text-green-600 mt-0.5">Notifications will be sent to <strong>{subEmail}</strong></p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-2">Full Name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input type="text" placeholder="Your full name" value={subName}
                        onChange={e => setSubName(e.target.value)}
                        className="pl-9 text-sm h-11 rounded-xl border-slate-200 bg-slate-50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-2">Class / Year</label>
                    <div className="relative">
                      <BookOpen size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input type="text" placeholder="e.g. BSc Sports 2nd Year" value={subClass}
                        onChange={e => setSubClass(e.target.value)}
                        className="pl-9 text-sm h-11 rounded-xl border-slate-200 bg-slate-50" />
                    </div>
                  </div>
                </div>
                <div className="mb-0">
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input type="email" placeholder="your@email.com" value={subEmail}
                      onChange={e => setSubEmail(e.target.value)}
                      className="pl-9 text-sm h-11 rounded-xl border-slate-200 bg-slate-50" />
                  </div>
                </div>
                <button type="submit" disabled={subscribing}
                  className="w-full h-12 mt-5 rounded-xl border-none text-white text-sm font-bold flex items-center justify-center gap-2.5 transition-all"
                  style={{
                    background: subscribing ? "#a78bfa" : "linear-gradient(135deg,#6d28d9,#4338ca)",
                    boxShadow: "0 6px 20px rgba(109,40,217,0.35)", cursor: subscribing ? "not-allowed" : "pointer"
                  }}>
                  {subscribing
                    ? <><Loader2 size={16} className="animate-spin" /> Subscribing...</>
                    : <><Bell size={16} /> Subscribe for Free</>
                  }
                </button>
                <p className="text-center text-xs text-slate-400 mt-3">No spam · Unsubscribe anytime by emailing us</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ FOOTER */}
      <footer className="w-full px-4 sm:px-10 py-12 sm:py-14" style={{ background: "#0f172a" }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 mb-10 sm:mb-11">
            {/* Brand */}
            <div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
                <Layers size={20} className="text-white" />
              </div>
              <p className="text-base font-bold text-white mb-2">Physical Education Dept.</p>
              <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
                RKSD College, Kaithal, Haryana<br />
                Est. 1959 · Dedicated to excellence in sports science and physical education for over six decades.
              </p>
            </div>
            {/* Dept Info */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>Department Info</h4>
              <div className="flex items-start gap-3 rounded-xl px-3 py-2.5 mb-2" style={{ background: "#1e293b" }}>
                <BookOpen size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>BSc Sports Science<br />BPEd · MPEd Programs</p>
              </div>
              <div className="flex items-start gap-3 rounded-xl px-3 py-2.5" style={{ background: "#1e293b" }}>
                <Users size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>Students, Faculty &amp; Staff<br />All in one platform</p>
              </div>
            </div>
            {/* Connect */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>Connect</h4>
              <a href="https://www.instagram.com/haryanvi__jaat_22?igsh=NDcxZHd5eG9nMjEx" target="_blank" rel="noreferrer"
                className="flex items-start gap-3 rounded-xl px-3 py-2.5 mb-2 no-underline hover:opacity-80 transition-opacity" style={{ background: "#1e293b" }}>
                <Instagram size={14} className="text-pink-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Instagram</p>
                  <p className="text-xs" style={{ color: "#f472b6" }}>@haryanvi__jaat_22</p>
                </div>
              </a>
              <a href="https://lightsalmon-mallard-505670.hostingersite.com/" target="_blank" rel="noreferrer"
                className="flex items-start gap-3 rounded-xl px-3 py-2.5 no-underline hover:opacity-80 transition-opacity" style={{ background: "#1e293b" }}>
                <Globe size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Portfolio</p>
                  <p className="text-xs" style={{ color: "#60a5fa" }}>View My Work</p>
                </div>
              </a>
            </div>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #1e293b", marginBottom: "22px" }} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <p className="text-xs" style={{ color: "#475569" }}>© 2025 RKSD College — Physical Education Department, Kaithal</p>
            <p className="text-xs" style={{ color: "#475569" }}>
              Built with ❤️ by <span style={{ color: "#6d28d9", fontWeight: 700 }}>Ajay Dhull</span> ·{" "}
              <span style={{ color: "#3b82f6", fontWeight: 600 }}>BSc Sports Science</span>
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}