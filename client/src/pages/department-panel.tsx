import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useVoice } from "@/hooks/use-voice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Trash2, Edit2, Mic, MicOff, LogOut, Building2, Users, BookOpen, 
  Bell, Image, Beaker, Info, BarChart3, GraduationCap, Phone, Mail,
  MapPin, Calendar, FileText, Eye, Sparkles, Clock, Save, X, Loader2,
  ChevronRight, ChevronDown, Settings
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { EnhancedAIInput } from "@/components/admin/EnhancedAIInput";
import { EnhancedAIPreview } from "@/components/admin/EnhancedAIPreview";

interface DepartmentStats {
  faculty: number;
  courses: number;
  classes: number;
  notices: number;
  gallery: number;
  labs: number;
  other: number;
  total: number;
}

interface StaffMember {
  id: string;
  full_name: string;
  employee_id: string;
  role: string;
  designation?: string;
  email?: string;
  phone?: string;
  qualification?: string;
  specialization?: string;
  is_active: boolean;
}

interface Course {
  id: string;
  course_name: string;
  course_code: string;
  course_type: string;
  duration?: string;
  description?: string;
  eligibility?: string;
  total_seats?: number;
  fees_per_year?: number;
}

interface ClassSchedule {
  id: string;
  course_name: string;
  shift: string;
  year: number;
  section: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_number?: string;
  teacher_name?: string;
  subject?: string;
}

interface DepartmentData {
  id: string;
  department_id: string;
  data_type: string;
  title: string;
  content: string;
  metadata?: any;
  created_at: string;
}

export default function DepartmentPanel() {
  const [, params] = useRoute("/department/:slug");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [departmentInfo, setDepartmentInfo] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ department_id: "", password: "" });
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentSection, setCurrentSection] = useState<string>("");
  
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  
  const [classFilter, setClassFilter] = useState({ shift: "all", year: "all", section: "all" });
  
  const { isListening, transcript, startListening, stopListening, resetTranscript, browserSupported } = useVoice();
  
  const slug = params?.slug;

  const [facultyForm, setFacultyForm] = useState({
    full_name: "", employee_id: "", role: "Faculty", designation: "",
    email: "", phone: "", qualification: "", specialization: ""
  });

  const [courseForm, setCourseForm] = useState({
    course_name: "", course_code: "", course_type: "UG", duration: "",
    description: "", eligibility: "", total_seats: "", fees_per_year: ""
  });

  const [classForm, setClassForm] = useState({
    course_id: "", course_name: "", shift: "morning", year: "1", section: "A",
    day_of_week: "Monday", start_time: "09:00", end_time: "10:00",
    room_number: "", teacher_name: "", subject: ""
  });

  const [deptInfoForm, setDeptInfoForm] = useState({
    name: "", head_name: "", contact_email: "", contact_phone: "",
    description: "", slogan: "", location: ""
  });

  const [otherForm, setOtherForm] = useState({
    data_type: "other", title: "", content: ""
  });

  const { data: deptData } = useQuery({
    queryKey: [`/api/department/${slug}`],
    enabled: !!slug,
    queryFn: async () => {
      const res = await fetch(`/api/department/${slug}`);
      if (!res.ok) throw new Error('Department not found');
      return res.json();
    },
  });

  const { data: statsData, refetch: refetchStats } = useQuery<{ stats: DepartmentStats }>({
    queryKey: [`/api/department/${departmentInfo?.id}/stats`],
    enabled: !!departmentInfo?.id && isLoggedIn && !!authToken,
    queryFn: async () => {
      const res = await fetch(`/api/department/${departmentInfo.id}/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  const { data: staffData, refetch: refetchStaff } = useQuery<{ staff: StaffMember[] }>({
    queryKey: [`/api/department/${departmentInfo?.id}/staff`],
    enabled: !!departmentInfo?.id && isLoggedIn && !!authToken,
    queryFn: async () => {
      const res = await fetch(`/api/department/${departmentInfo.id}/staff`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch staff');
      return res.json();
    },
  });

  const { data: coursesData, refetch: refetchCourses } = useQuery<{ courses: Course[] }>({
    queryKey: [`/api/department/${departmentInfo?.id}/courses-list`],
    enabled: !!departmentInfo?.id && isLoggedIn && !!authToken,
    queryFn: async () => {
      const res = await fetch(`/api/department/${departmentInfo.id}/courses-list`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
  });

  const { data: schedulesData, refetch: refetchSchedules } = useQuery<{ schedules: ClassSchedule[] }>({
    queryKey: [`/api/department/${departmentInfo?.id}/class-schedules`, classFilter],
    enabled: !!departmentInfo?.id && isLoggedIn && !!authToken,
    queryFn: async () => {
      let url = `/api/department/${departmentInfo.id}/class-schedules`;
      const params = new URLSearchParams();
      if (classFilter.shift !== "all") params.append("shift", classFilter.shift);
      if (classFilter.year !== "all") params.append("year", classFilter.year);
      if (classFilter.section !== "all") params.append("section", classFilter.section);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch schedules');
      return res.json();
    },
  });

  const { data: fullInfoData, refetch: refetchFullInfo } = useQuery<{ department: any }>({
    queryKey: [`/api/department/${departmentInfo?.id}/full-info`],
    enabled: !!departmentInfo?.id && isLoggedIn && !!authToken,
    queryFn: async () => {
      const res = await fetch(`/api/department/${departmentInfo.id}/full-info`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch info');
      return res.json();
    },
  });

  const { data: otherData, refetch: refetchOther } = useQuery<{ data: DepartmentData[] }>({
    queryKey: [`/api/department/${departmentInfo?.id}/data`],
    enabled: !!departmentInfo?.id && isLoggedIn && !!authToken,
    queryFn: async () => {
      const res = await fetch(`/api/department/${departmentInfo.id}/data`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch data');
      return res.json();
    },
  });

  const { data: localFacultyData, refetch: refetchLocalFaculty } = useQuery<{ faculty: StaffMember[] }>({
    queryKey: [`/api/department/${departmentInfo?.id}/local-faculty`],
    enabled: !!departmentInfo?.id && isLoggedIn && !!authToken,
    queryFn: async () => {
      const res = await fetch(`/api/department/${departmentInfo.id}/local-faculty`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch local faculty');
      return res.json();
    },
  });

  useEffect(() => {
    if (!departmentInfo?.id || !isLoggedIn) return;

    const channels = [
      supabase.channel('staff-changes').on('postgres_changes', 
        { event: '*', schema: 'public', table: 'staff_members', filter: `department_id=eq.${departmentInfo.id}` },
        () => { refetchStaff(); refetchStats(); }
      ).subscribe(),
      
      supabase.channel('courses-changes').on('postgres_changes', 
        { event: '*', schema: 'public', table: 'courses', filter: `department_id=eq.${departmentInfo.id}` },
        () => { refetchCourses(); refetchStats(); }
      ).subscribe(),
      
      supabase.channel('schedules-changes').on('postgres_changes', 
        { event: '*', schema: 'public', table: 'class_schedules', filter: `department_id=eq.${departmentInfo.id}` },
        () => { refetchSchedules(); refetchStats(); }
      ).subscribe(),
      
      supabase.channel('dept-data-changes').on('postgres_changes', 
        { event: '*', schema: 'public', table: 'department_data', filter: `department_id=eq.${departmentInfo.id}` },
        () => { refetchOther(); refetchStats(); }
      ).subscribe(),
      
      supabase.channel('local-faculty-changes').on('postgres_changes', 
        { event: '*', schema: 'public', table: 'department_local_faculty', filter: `department_id=eq.${departmentInfo.id}` },
        () => { refetchLocalFaculty(); refetchStats(); }
      ).subscribe(),
    ];

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [departmentInfo?.id, isLoggedIn]);

  useEffect(() => {
    if (transcript && isAiMode) {
      setAiPrompt(transcript);
    }
  }, [transcript, isAiMode]);

  useEffect(() => {
    if (fullInfoData?.department) {
      const dept = fullInfoData.department;
      setDeptInfoForm({
        name: dept.name || "",
        head_name: dept.head_name || "",
        contact_email: dept.contact_email || "",
        contact_phone: dept.contact_phone || "",
        description: dept.description || "",
        slogan: dept.slogan || "",
        location: dept.location || ""
      });
    }
  }, [fullInfoData]);

  useEffect(() => {
    if (slug) {
      const token = localStorage.getItem(`dept_token_${slug}`);
      if (token) {
        validateToken(token);
      }
    }
  }, [slug]);

  const validateToken = async (token: string) => {
    try {
      const res = await fetch('/api/department/verify-token', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartmentInfo(data.department);
        setAuthToken(token);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem(`dept_token_${slug}`);
      }
    } catch (error) {
      localStorage.removeItem(`dept_token_${slug}`);
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: { department_id: string; password: string }) => {
      const res = await fetch('/api/department/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      return res.json();
    },
    onSuccess: (data) => {
      setDepartmentInfo(data.department);
      setAuthToken(data.token);
      setIsLoggedIn(true);
      localStorage.setItem(`dept_token_${slug}`, data.token);
      toast({ title: "Success", description: "Logged in successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Invalid credentials", variant: "destructive" });
    },
  });

  const handleLogout = () => {
    setIsLoggedIn(false);
    setDepartmentInfo(null);
    setAuthToken(null);
    localStorage.removeItem(`dept_token_${slug}`);
    toast({ title: "Logged out", description: "You have been logged out" });
  };

  const handleToggleVoice = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleGenerateAI = async (type: string) => {
    if (!aiPrompt.trim()) {
      toast({ title: "Error", description: "Please enter a description", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch(`/api/department/${departmentInfo.id}/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ type, prompt: aiPrompt }),
      });

      if (!res.ok) throw new Error('AI generation failed');

      const data = await res.json();
      setAiGeneratedData(data);
      setCurrentPreviewIndex(0);
      toast({ title: "Success", description: "Content generated successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const addLocalFacultyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/department/${departmentInfo.id}/local-faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add local faculty');
      return res.json();
    },
    onSuccess: () => {
      refetchLocalFaculty();
      refetchStats();
      resetForms();
      setIsAddDialogOpen(false);
      toast({ title: "Success", description: "Local faculty member added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const addCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/department/${departmentInfo.id}/courses-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add course');
      return res.json();
    },
    onSuccess: () => {
      refetchCourses();
      refetchStats();
      resetForms();
      setIsAddDialogOpen(false);
      toast({ title: "Success", description: "Course added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const addScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/department/${departmentInfo.id}/class-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({
          ...data,
          year: parseInt(data.year)
        }),
      });
      if (!res.ok) throw new Error('Failed to add class schedule');
      return res.json();
    },
    onSuccess: () => {
      refetchSchedules();
      refetchStats();
      resetForms();
      setIsAddDialogOpen(false);
      toast({ title: "Success", description: "Class schedule added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const addOtherMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/department/${departmentInfo.id}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add data');
      return res.json();
    },
    onSuccess: () => {
      refetchOther();
      refetchStats();
      resetForms();
      setIsAddDialogOpen(false);
      toast({ title: "Success", description: "Data added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateInfoMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/department/${departmentInfo.id}/full-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update info');
      return res.json();
    },
    onSuccess: () => {
      refetchFullInfo();
      toast({ title: "Success", description: "Department info updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/department/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ is_active: false }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      refetchStaff();
      refetchStats();
      toast({ title: "Success", description: "Staff member removed" });
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/department/courses-list/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      refetchCourses();
      refetchStats();
      toast({ title: "Success", description: "Course removed" });
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/department/class-schedules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      refetchSchedules();
      refetchStats();
      toast({ title: "Success", description: "Class schedule removed" });
    }
  });

  const deleteOtherMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/department/data/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      refetchOther();
      refetchStats();
      toast({ title: "Success", description: "Data removed" });
    }
  });

  const deleteLocalFacultyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/department/local-faculty/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      refetchLocalFaculty();
      refetchStats();
      toast({ title: "Success", description: "Local faculty member removed" });
    }
  });

  const resetForms = () => {
    setFacultyForm({
      full_name: "", employee_id: "", role: "Faculty", designation: "",
      email: "", phone: "", qualification: "", specialization: ""
    });
    setCourseForm({
      course_name: "", course_code: "", course_type: "UG", duration: "",
      description: "", eligibility: "", total_seats: "", fees_per_year: ""
    });
    setClassForm({
      course_id: "", course_name: "", shift: "morning", year: "1", section: "A",
      day_of_week: "Monday", start_time: "09:00", end_time: "10:00",
      room_number: "", teacher_name: "", subject: ""
    });
    setOtherForm({ data_type: "other", title: "", content: "" });
    setAiPrompt("");
    setAiGeneratedData(null);
    setCurrentPreviewIndex(0);
    setIsAiMode(false);
    resetTranscript();
  };

  const openAddDialog = (section: string) => {
    setCurrentSection(section);
    resetForms();
    setIsAddDialogOpen(true);
  };

  const handleConfirmAI = async (type: string) => {
    if (!aiGeneratedData) return;
    
    const entries = aiGeneratedData.entries || [aiGeneratedData];
    
    try {
      for (const entry of entries) {
        if (type === 'faculty') {
          await addLocalFacultyMutation.mutateAsync(entry);
        } else if (type === 'course') {
          await addCourseMutation.mutateAsync(entry);
        } else if (type === 'class_schedule') {
          await addScheduleMutation.mutateAsync(entry);
        } else {
          await addOtherMutation.mutateAsync({
            data_type: type,
            title: entry.title,
            content: entry.content
          });
        }
      }
      resetForms();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error confirming AI entries:', error);
    }
  };

  const renderAIPreviewContent = (entry: any, type: string) => {
    if (type === 'faculty') {
      return (
        <div className="space-y-2 text-sm">
          <div><strong>Name:</strong> {entry.full_name}</div>
          <div><strong>Employee ID:</strong> {entry.employee_id}</div>
          <div><strong>Role:</strong> {entry.role}</div>
          {entry.designation && <div><strong>Designation:</strong> {entry.designation}</div>}
          {entry.qualification && <div><strong>Qualification:</strong> {entry.qualification}</div>}
          {entry.specialization && <div><strong>Specialization:</strong> {entry.specialization}</div>}
          {entry.email && <div><strong>Email:</strong> {entry.email}</div>}
          {entry.phone && <div><strong>Phone:</strong> {entry.phone}</div>}
        </div>
      );
    } else if (type === 'course') {
      return (
        <div className="space-y-2 text-sm">
          <div><strong>Course Name:</strong> {entry.course_name}</div>
          <div><strong>Course Code:</strong> {entry.course_code}</div>
          <div><strong>Type:</strong> {entry.course_type}</div>
          {entry.duration && <div><strong>Duration:</strong> {entry.duration}</div>}
          {entry.description && <div><strong>Description:</strong> {entry.description}</div>}
          {entry.eligibility && <div><strong>Eligibility:</strong> {entry.eligibility}</div>}
          {entry.total_seats && <div><strong>Seats:</strong> {entry.total_seats}</div>}
        </div>
      );
    } else if (type === 'class_schedule') {
      return (
        <div className="space-y-2 text-sm">
          <div><strong>Course:</strong> {entry.course_name}</div>
          <div><strong>Shift:</strong> {entry.shift}</div>
          <div><strong>Year:</strong> {entry.year} | <strong>Section:</strong> {entry.section}</div>
          <div><strong>Day:</strong> {entry.day_of_week}</div>
          <div><strong>Time:</strong> {entry.start_time} - {entry.end_time}</div>
          {entry.room_number && <div><strong>Room:</strong> {entry.room_number}</div>}
          {entry.teacher_name && <div><strong>Teacher:</strong> {entry.teacher_name}</div>}
          {entry.subject && <div><strong>Subject:</strong> {entry.subject}</div>}
        </div>
      );
    }
    return (
      <div className="space-y-2 text-sm">
        <div><strong>Title:</strong> {entry.title}</div>
        <div><strong>Content:</strong> {entry.content}</div>
      </div>
    );
  };

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="p-8">
          <CardContent className="text-center">
            <h1 className="text-xl font-bold text-gray-900">Department Not Found</h1>
            <p className="text-gray-600 mt-2">Please check the URL and try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Department Login</CardTitle>
            <CardDescription>
              {deptData?.department?.name || 'Loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); loginMutation.mutate(loginForm); }} className="space-y-4">
              <div>
                <Label htmlFor="dept_id">Department ID</Label>
                <Input
                  id="dept_id"
                  value={loginForm.department_id}
                  onChange={(e) => setLoginForm({ ...loginForm, department_id: e.target.value })}
                  placeholder="Enter department ID"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = statsData?.stats || { faculty: 0, courses: 0, classes: 0, notices: 0, gallery: 0, labs: 0, other: 0, total: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">{departmentInfo?.name || 'Department Panel'}</h1>
              <p className="text-xs text-gray-500">Management Panel</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="info" className="text-xs sm:text-sm">
              <Info className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Info</span>
            </TabsTrigger>
            <TabsTrigger value="faculty" className="text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Faculty</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="text-xs sm:text-sm">
              <BookOpen className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="text-xs sm:text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Classes</span>
            </TabsTrigger>
            <TabsTrigger value="others" className="text-xs sm:text-sm">
              <Settings className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Others</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">Faculty</p>
                      <p className="text-3xl font-bold">{stats.faculty}</p>
                    </div>
                    <Users className="h-8 w-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">Courses</p>
                      <p className="text-3xl font-bold">{stats.courses}</p>
                    </div>
                    <BookOpen className="h-8 w-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">Classes</p>
                      <p className="text-3xl font-bold">{stats.classes}</p>
                    </div>
                    <Calendar className="h-8 w-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">Total Items</p>
                      <p className="text-3xl font-bold">{stats.total}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => { setActiveTab("faculty"); openAddDialog("faculty"); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Local Faculty
                </Button>
                <Button variant="outline" onClick={() => { setActiveTab("classes"); openAddDialog("classes"); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Class
                </Button>
                <Button variant="outline" onClick={() => { setActiveTab("others"); openAddDialog("others"); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Other
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Department Head</p>
                    <p className="font-medium">{fullInfoData?.department?.head_name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Email</p>
                    <p className="font-medium">{fullInfoData?.department?.contact_email || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Phone</p>
                    <p className="font-medium">{fullInfoData?.department?.contact_phone || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{fullInfoData?.department?.description?.substring(0, 100) || 'Not set'}...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Department Information</CardTitle>
                <CardDescription>View creation details and manage additional information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Creation Details (Read Only - Set by Admin)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Department Name</p>
                      <p className="font-medium text-gray-900 bg-white px-3 py-2 rounded border">{fullInfoData?.department?.name || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Head of Department</p>
                      <p className="font-medium text-gray-900 bg-white px-3 py-2 rounded border">{fullInfoData?.department?.head_name || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Contact Email</p>
                      <p className="font-medium text-gray-900 bg-white px-3 py-2 rounded border">{fullInfoData?.department?.contact_email || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Contact Phone</p>
                      <p className="font-medium text-gray-900 bg-white px-3 py-2 rounded border">{fullInfoData?.department?.contact_phone || 'Not set'}</p>
                    </div>
                    <div className="col-span-full">
                      <p className="text-xs text-gray-500 mb-1">Description</p>
                      <p className="font-medium text-gray-900 bg-white px-3 py-2 rounded border">{fullInfoData?.department?.description || 'Not set'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Edit2 className="h-4 w-4" />
                    Additional Information (Editable)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Location / Address</Label>
                      <Input
                        value={deptInfoForm.location}
                        onChange={(e) => setDeptInfoForm({ ...deptInfoForm, location: e.target.value })}
                        placeholder="Department location..."
                      />
                    </div>
                    <div>
                      <Label>Department Slogan</Label>
                      <Input
                        value={deptInfoForm.slogan}
                        onChange={(e) => setDeptInfoForm({ ...deptInfoForm, slogan: e.target.value })}
                        placeholder="Excellence in education..."
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      onClick={() => updateInfoMutation.mutate({ location: deptInfoForm.location, slogan: deptInfoForm.slogan })} 
                      disabled={updateInfoMutation.isPending}
                    >
                      {updateInfoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => openAddDialog("info")}>
                      <Plus className="h-4 w-4 mr-2" /> Add Custom Field
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Custom Information Fields</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {otherData?.data?.filter(d => d.data_type === 'info').map((item) => (
                      <Card key={item.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{item.title}</h4>
                              <p className="text-sm text-gray-600">{item.content}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteOtherMutation.mutate(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {(!otherData?.data || otherData.data.filter(d => d.data_type === 'info').length === 0) && (
                      <p className="text-gray-500 text-sm col-span-full">No custom fields added yet.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faculty" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Faculty Members</CardTitle>
                  <CardDescription>View admin staff and add department-specific faculty</CardDescription>
                </div>
                <Button onClick={() => openAddDialog("faculty")}>
                  <Plus className="h-4 w-4 mr-2" /> Add Local Faculty
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Official Staff (From Admin Panel - Read Only)
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {staffData?.staff?.map((member) => (
                      <Card key={member.id} className="border bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">{member.full_name}</h3>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                <Badge variant="secondary" className="text-xs">{member.role}</Badge>
                                {member.designation && <Badge variant="outline" className="text-xs">{member.designation}</Badge>}
                              </div>
                              <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                                {member.qualification && <p>Qualification: {member.qualification}</p>}
                                {member.email && <p>Email: {member.email}</p>}
                                {member.phone && <p>Phone: {member.phone}</p>}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {(!staffData?.staff || staffData.staff.length === 0) && (
                      <p className="text-gray-500 text-sm col-span-full">No official staff members assigned to this department.</p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Department Local Faculty (Added Here)
                    <Badge variant="outline" className="ml-2">Not visible in Admin Panel</Badge>
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {localFacultyData?.faculty?.map((member: StaffMember) => (
                      <Card key={member.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">{member.full_name}</h3>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                <Badge className="text-xs bg-green-100 text-green-700">{member.role}</Badge>
                                {member.designation && <Badge variant="outline" className="text-xs">{member.designation}</Badge>}
                              </div>
                              <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                                {member.qualification && <p>Qualification: {member.qualification}</p>}
                                {member.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{member.email}</p>}
                                {member.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{member.phone}</p>}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteLocalFacultyMutation.mutate(member.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          <Badge variant="secondary" className="mt-2">{member.employee_id}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                    {(!localFacultyData?.faculty || localFacultyData.faculty.length === 0) && (
                      <p className="text-gray-500 text-sm col-span-full">No local faculty added yet. Click "Add Local Faculty" to add department-specific staff.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Courses Offered</CardTitle>
                  <CardDescription>Courses assigned to this department (managed by Admin Panel)</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {coursesData?.courses?.map((course) => (
                    <Card key={course.id} className="border bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{course.course_name}</h3>
                            <div className="flex gap-2 mt-1">
                              <Badge>{course.course_code}</Badge>
                              <Badge variant="outline">{course.course_type}</Badge>
                            </div>
                            <div className="mt-2 text-xs text-gray-500 space-y-1">
                              {course.duration && <p>Duration: {course.duration}</p>}
                              {course.eligibility && <p>Eligibility: {course.eligibility}</p>}
                              {course.total_seats && <p>Seats: {course.total_seats}</p>}
                              {course.fees_per_year && <p>Fees: ₹{course.fees_per_year}/year</p>}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">Admin Managed</Badge>
                        </div>
                        {course.description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{course.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {(!coursesData?.courses || coursesData.courses.length === 0) && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No courses assigned to this department</p>
                      <p className="text-sm">Courses are managed by the Admin Panel</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Class Schedules</CardTitle>
                  <CardDescription>Manage class timetables (Shift &gt; Year &gt; Section)</CardDescription>
                </div>
                <Button onClick={() => openAddDialog("classes")}>
                  <Plus className="h-4 w-4 mr-2" /> Add Class
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Select value={classFilter.shift} onValueChange={(v) => setClassFilter({ ...classFilter, shift: v })}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Shifts</SelectItem>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={classFilter.year} onValueChange={(v) => setClassFilter({ ...classFilter, year: v })}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {[1, 2, 3, 4, 5, 6].map((y) => (
                        <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={classFilter.section} onValueChange={(v) => setClassFilter({ ...classFilter, section: v })}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {['A', 'B', 'C', 'D', 'E'].map((s) => (
                        <SelectItem key={s} value={s}>Section {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                    const daySchedules = schedulesData?.schedules?.filter(s => s.day_of_week === day) || [];
                    if (daySchedules.length === 0) return null;
                    
                    return (
                      <Card key={day} className="border">
                        <CardHeader className="py-2 px-4 bg-gray-50">
                          <CardTitle className="text-sm font-medium">{day}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {daySchedules.map((schedule) => (
                              <div key={schedule.id} className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium">{schedule.subject || schedule.course_name}</p>
                                    <p className="text-xs text-gray-600">
                                      {schedule.start_time} - {schedule.end_time}
                                    </p>
                                    <div className="flex gap-1 mt-1">
                                      <Badge variant="outline" className="text-xs">{schedule.shift}</Badge>
                                      <Badge variant="outline" className="text-xs">Yr {schedule.year}</Badge>
                                      <Badge variant="outline" className="text-xs">Sec {schedule.section}</Badge>
                                    </div>
                                    {schedule.room_number && <p className="text-xs mt-1">Room: {schedule.room_number}</p>}
                                    {schedule.teacher_name && <p className="text-xs">Teacher: {schedule.teacher_name}</p>}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {(!schedulesData?.schedules || schedulesData.schedules.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No class schedules added yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="others" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Other Data</CardTitle>
                  <CardDescription>Notices, gallery, labs, and other information</CardDescription>
                </div>
                <Button onClick={() => openAddDialog("others")}>
                  <Plus className="h-4 w-4 mr-2" /> Add Data
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherData?.data?.filter(d => !['info'].includes(d.data_type)).map((item) => (
                    <Card key={item.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge className="mb-2">{item.data_type}</Badge>
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-3">{item.content}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteOtherMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!otherData?.data || otherData.data.filter(d => !['info'].includes(d.data_type)).length === 0) && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No other data added yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add {currentSection === "faculty" ? "Faculty Member" : 
                   currentSection === "courses" ? "Course" : 
                   currentSection === "classes" ? "Class Schedule" : "Data"}
            </DialogTitle>
            <div className="flex gap-2 mt-2">
              <Button
                variant={!isAiMode ? "default" : "outline"}
                size="sm"
                onClick={() => { setIsAiMode(false); setAiGeneratedData(null); }}
              >
                <Edit2 className="h-4 w-4 mr-1" /> Manual
              </Button>
              <Button
                variant={isAiMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAiMode(true)}
              >
                <Sparkles className="h-4 w-4 mr-1" /> AI Mode
              </Button>
            </div>
          </DialogHeader>

          {isAiMode ? (
            <div className="space-y-4">
              {!aiGeneratedData ? (
                <EnhancedAIInput
                  prompt={aiPrompt}
                  onPromptChange={setAiPrompt}
                  onGenerate={() => handleGenerateAI(
                    currentSection === "faculty" ? "faculty" :
                    currentSection === "courses" ? "course" :
                    currentSection === "classes" ? "class_schedule" : "other"
                  )}
                  isGenerating={isGenerating}
                  isListening={isListening}
                  onToggleVoice={handleToggleVoice}
                  browserSupported={browserSupported}
                  placeholder={
                    currentSection === "faculty" 
                      ? "Describe the faculty members you want to add (e.g., 'Add Dr. John Smith, Professor of Computer Science with PhD...')"
                      : currentSection === "courses"
                      ? "Describe the courses (e.g., 'Add Bachelor of Computer Science, 4 years, 60 seats...')"
                      : currentSection === "classes"
                      ? "Describe the class schedule (e.g., 'Add Data Structures class for Year 2 Section A, Monday 9 AM...')"
                      : "Describe what you want to add..."
                  }
                  sectionType={currentSection}
                  onClear={() => { setAiPrompt(""); resetTranscript(); }}
                />
              ) : (
                <EnhancedAIPreview
                  entries={aiGeneratedData.entries || [aiGeneratedData]}
                  currentIndex={currentPreviewIndex}
                  onIndexChange={setCurrentPreviewIndex}
                  renderPreview={(entry) => renderAIPreviewContent(entry, 
                    currentSection === "faculty" ? "faculty" :
                    currentSection === "courses" ? "course" :
                    currentSection === "classes" ? "class_schedule" : "other"
                  )}
                  onConfirmAll={() => handleConfirmAI(
                    currentSection === "faculty" ? "faculty" :
                    currentSection === "courses" ? "course" :
                    currentSection === "classes" ? "class_schedule" : "other"
                  )}
                  onRegenerate={() => setAiGeneratedData(null)}
                  entryTypeName={
                    currentSection === "faculty" ? "Faculty" :
                    currentSection === "courses" ? "Course" :
                    currentSection === "classes" ? "Class" : "Entry"
                  }
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {currentSection === "faculty" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name *</Label>
                      <Input
                        value={facultyForm.full_name}
                        onChange={(e) => setFacultyForm({ ...facultyForm, full_name: e.target.value })}
                        placeholder="Dr. John Smith"
                      />
                    </div>
                    <div>
                      <Label>Employee ID *</Label>
                      <Input
                        value={facultyForm.employee_id}
                        onChange={(e) => setFacultyForm({ ...facultyForm, employee_id: e.target.value })}
                        placeholder="EMP-001"
                      />
                    </div>
                    <div>
                      <Label>Role *</Label>
                      <Select value={facultyForm.role} onValueChange={(v) => setFacultyForm({ ...facultyForm, role: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Professor">Professor</SelectItem>
                          <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                          <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                          <SelectItem value="Lecturer">Lecturer</SelectItem>
                          <SelectItem value="Faculty">Faculty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Designation</Label>
                      <Input
                        value={facultyForm.designation}
                        onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                        placeholder="HOD, Coordinator, etc."
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={facultyForm.email}
                        onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                        placeholder="john@college.edu"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={facultyForm.phone}
                        onChange={(e) => setFacultyForm({ ...facultyForm, phone: e.target.value })}
                        placeholder="+91 XXXXXXXXXX"
                      />
                    </div>
                    <div>
                      <Label>Qualification</Label>
                      <Input
                        value={facultyForm.qualification}
                        onChange={(e) => setFacultyForm({ ...facultyForm, qualification: e.target.value })}
                        placeholder="PhD, M.Tech, etc."
                      />
                    </div>
                    <div>
                      <Label>Specialization</Label>
                      <Input
                        value={facultyForm.specialization}
                        onChange={(e) => setFacultyForm({ ...facultyForm, specialization: e.target.value })}
                        placeholder="Machine Learning, etc."
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addLocalFacultyMutation.mutate(facultyForm)}
                    disabled={!facultyForm.full_name || !facultyForm.employee_id || addLocalFacultyMutation.isPending}
                  >
                    {addLocalFacultyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add Faculty
                  </Button>
                </>
              )}

              {currentSection === "courses" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Course Name *</Label>
                      <Input
                        value={courseForm.course_name}
                        onChange={(e) => setCourseForm({ ...courseForm, course_name: e.target.value })}
                        placeholder="Bachelor of Computer Science"
                      />
                    </div>
                    <div>
                      <Label>Course Code *</Label>
                      <Input
                        value={courseForm.course_code}
                        onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
                        placeholder="BCS-001"
                      />
                    </div>
                    <div>
                      <Label>Course Type</Label>
                      <Select value={courseForm.course_type} onValueChange={(v) => setCourseForm({ ...courseForm, course_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UG">UG (Undergraduate)</SelectItem>
                          <SelectItem value="PG">PG (Postgraduate)</SelectItem>
                          <SelectItem value="Diploma">Diploma</SelectItem>
                          <SelectItem value="Certificate">Certificate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Duration</Label>
                      <Input
                        value={courseForm.duration}
                        onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                        placeholder="4 Years"
                      />
                    </div>
                    <div>
                      <Label>Total Seats</Label>
                      <Input
                        type="number"
                        value={courseForm.total_seats}
                        onChange={(e) => setCourseForm({ ...courseForm, total_seats: e.target.value })}
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <Label>Fees Per Year</Label>
                      <Input
                        type="number"
                        value={courseForm.fees_per_year}
                        onChange={(e) => setCourseForm({ ...courseForm, fees_per_year: e.target.value })}
                        placeholder="50000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Eligibility</Label>
                    <Input
                      value={courseForm.eligibility}
                      onChange={(e) => setCourseForm({ ...courseForm, eligibility: e.target.value })}
                      placeholder="12th with Science (PCM)"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      placeholder="Course description..."
                      rows={3}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addCourseMutation.mutate(courseForm)}
                    disabled={!courseForm.course_name || !courseForm.course_code || addCourseMutation.isPending}
                  >
                    {addCourseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add Course
                  </Button>
                </>
              )}

              {currentSection === "classes" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Course *</Label>
                      <Select 
                        value={classForm.course_id} 
                        onValueChange={(v) => {
                          const selectedCourse = coursesData?.courses?.find(c => c.id === v);
                          if (selectedCourse) {
                            const duration = selectedCourse.duration?.match(/(\d+)/)?.[1] || "3";
                            setClassForm({ 
                              ...classForm, 
                              course_id: v, 
                              course_name: selectedCourse.course_name,
                              year: Math.min(parseInt(classForm.year) || 1, parseInt(duration)).toString()
                            });
                          }
                        }}
                      >
                        <SelectTrigger className={!classForm.course_id ? "border-red-300" : ""}>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {coursesData?.courses?.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.course_name} ({course.course_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!classForm.course_id && (
                        <p className="text-xs text-red-500 mt-1">Please select a course first</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label>Subject *</Label>
                      <Input
                        value={classForm.subject}
                        onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
                        placeholder="Data Structures & Algorithms"
                      />
                    </div>
                    <div>
                      <Label>Year *</Label>
                      <Select value={classForm.year} onValueChange={(v) => setClassForm({ ...classForm, year: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const selectedCourse = coursesData?.courses?.find(c => c.id === classForm.course_id);
                            const maxYear = selectedCourse?.duration ? parseInt(selectedCourse.duration.match(/(\d+)/)?.[1] || "3") : 6;
                            return Array.from({ length: maxYear }, (_, i) => i + 1).map((y) => (
                              <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Section *</Label>
                      <Select value={classForm.section} onValueChange={(v) => setClassForm({ ...classForm, section: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['A', 'B', 'C', 'D', 'E'].map((s) => (
                            <SelectItem key={s} value={s}>Section {s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Shift *</Label>
                      <Select value={classForm.shift} onValueChange={(v) => setClassForm({ ...classForm, shift: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Day of Week *</Label>
                      <Select value={classForm.day_of_week} onValueChange={(v) => setClassForm({ ...classForm, day_of_week: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Start Time *</Label>
                      <Input
                        type="time"
                        value={classForm.start_time}
                        onChange={(e) => setClassForm({ ...classForm, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>End Time *</Label>
                      <Input
                        type="time"
                        value={classForm.end_time}
                        onChange={(e) => setClassForm({ ...classForm, end_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Room Number</Label>
                      <Input
                        value={classForm.room_number}
                        onChange={(e) => setClassForm({ ...classForm, room_number: e.target.value })}
                        placeholder="Room 101"
                      />
                    </div>
                    <div>
                      <Label>Teacher Name</Label>
                      <Input
                        value={classForm.teacher_name}
                        onChange={(e) => setClassForm({ ...classForm, teacher_name: e.target.value })}
                        placeholder="Dr. John Smith"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addScheduleMutation.mutate(classForm)}
                    disabled={!classForm.course_id || !classForm.subject || addScheduleMutation.isPending}
                  >
                    {addScheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add Class Schedule
                  </Button>
                </>
              )}

              {currentSection === "others" && (
                <>
                  <div>
                    <Label>Data Type *</Label>
                    <Select value={otherForm.data_type} onValueChange={(v) => setOtherForm({ ...otherForm, data_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notice">Notice</SelectItem>
                        <SelectItem value="gallery">Gallery</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                        <SelectItem value="achievement">Achievement</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={otherForm.title}
                      onChange={(e) => setOtherForm({ ...otherForm, title: e.target.value })}
                      placeholder="Enter title"
                    />
                  </div>
                  <div>
                    <Label>Content *</Label>
                    <Textarea
                      value={otherForm.content}
                      onChange={(e) => setOtherForm({ ...otherForm, content: e.target.value })}
                      placeholder="Enter content..."
                      rows={4}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => addOtherMutation.mutate(otherForm)}
                    disabled={!otherForm.title || !otherForm.content || addOtherMutation.isPending}
                  >
                    {addOtherMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add Data
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
