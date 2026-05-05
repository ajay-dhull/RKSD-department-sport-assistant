import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Home,
  Building2,
  Trophy,
  Menu,
  LogOut,
  Info,
  Users,
  GraduationCap,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { GeneralInfoSectionNew } from "@/components/admin/GeneralInfoSectionNew";
import { CoursesSection } from "@/components/admin/CoursesSection";
import { StaffSection } from "@/components/admin/StaffSection";
import { SyllabusManager } from "@/components/admin/SyllabusManager";
import { DepartmentsManager } from "@/components/head-admin/DepartmentsManager";
import { EventsManager } from "@/components/head-admin/EventsManager";
import { UpdatesAdminSection } from "@/components/head-admin/UpdatesAdminSection";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "general", label: "General Information", icon: Info },
  { id: "courses", label: "Courses Detail", icon: GraduationCap },
  { id: "syllabus", label: "Syllabus Manager", icon: BookOpen },
  { id: "staff", label: "Staff Detail", icon: Users },
  { id: "departments", label: "Mini Panels", icon: Building2 },
  { id: "events", label: "Achievements", icon: Trophy },
  { id: "updates", label: "Updates & Subscribers", icon: ExternalLink },
];

export default function MainAdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
    }
  }, [token, setLocation]);

  const { data: departmentsData } = useQuery<any>({
    queryKey: ["/api/admin/departments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/departments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch departments");
      return await res.json();
    },
  });

  const { data: statsData } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { students: 0, staff: 0, courses: 0, departments: 0 };
      return await res.json();
    },
  });

  useEffect(() => {
    if (!token) return;

    const departmentsChannel = supabase
      .channel('dashboard-departments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/departments"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      })
      .subscribe();

    const coursesChannel = supabase
      .channel('dashboard-courses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      })
      .subscribe();

    const staffChannel = supabase
      .channel('dashboard-staff')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_members' }, () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(departmentsChannel);
      supabase.removeChannel(coursesChannel);
      supabase.removeChannel(staffChannel);
    };
  }, [queryClient, token]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setLocation("/admin/login");
  };

  const handleDataChange = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/college-info"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/college-settings"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/departments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/head-admin/events"] });
  };

  const NavContent = () => (
    <div className="space-y-2 p-4 flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
        <p className="text-sm text-gray-600">Physical Education Dept.</p>
      </div>
      <div className="flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className="w-full justify-start mb-2"
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </div>
      <Button
        variant="outline"
        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );

  const departments = departmentsData?.departments || [];
  const stats = statsData || { students: 0, staff: 0, courses: 0, departments: 0 };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-4 z-50">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <NavContent />
          </SheetContent>
        </Sheet>
        <h1 className="ml-4 text-lg font-semibold">Physical Education - Admin</h1>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 fixed left-0 top-0 bottom-0">
          <ScrollArea className="h-full">
            <NavContent />
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 mt-16 lg:mt-0 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                      Physical Education Dashboard
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">
                      R.K.S.D. (PG) College - Physical Education Department
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700">Live Updates Active</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-blue-900">
                          Total Students
                        </CardTitle>
                        <div className="p-3 bg-blue-500 rounded-lg">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.students?.toLocaleString() || '5,200'}</div>
                      <p className="text-sm text-blue-700 mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        Active enrollments
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-purple-900">
                          Faculty & Staff
                        </CardTitle>
                        <div className="p-3 bg-purple-500 rounded-lg">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-purple-900">{stats.staff || 0}</div>
                      <p className="text-sm text-purple-700 mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                        Teaching & Non-teaching
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-green-900">
                          Academic Programs
                        </CardTitle>
                        <div className="p-3 bg-green-500 rounded-lg">
                          <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-green-900">{stats.courses || 0}</div>
                      <p className="text-sm text-green-700 mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        UG, PG & Ph.D programs
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-orange-900">
                          Mini Panels
                        </CardTitle>
                        <div className="p-3 bg-orange-500 rounded-lg">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold text-orange-900">{stats.departments || departments.length}</div>
                      <p className="text-sm text-orange-700 mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        Active mini panels
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Mini Panel Overview
                      </CardTitle>
                      <CardDescription>
                        Access and manage individual teacher panels
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {departments.length > 0 ? (
                        <ScrollArea className="h-[320px] pr-4">
                          <div className="space-y-3">
                            {departments.map((dept: any) => (
                              <div
                                key={dept.id}
                                className="group flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900">{dept.name}</h4>
                                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                      Active
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">ID: {dept.department_id}</p>
                                  {dept.head_name && (
                                    <div className="mt-2 flex items-center gap-4">
                                      <p className="text-sm text-gray-700">
                                        <span className="font-medium">Head:</span> {dept.head_name}
                                      </p>
                                      {dept.contact_phone && (
                                        <p className="text-sm text-gray-600">
                                          📞 {dept.contact_phone}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  className="ml-4 group-hover:bg-blue-600 group-hover:text-white"
                                  variant="outline"
                                  onClick={() => window.open(dept.panel_link, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Access Panel
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-12">
                          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No mini panels created yet</p>
                          <Button
                            size="sm"
                            className="mt-3"
                            onClick={() => setActiveTab('departments')}
                          >
                            Create First Mini Panel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-green-600" />
                        Quick Actions
                      </CardTitle>
                      <CardDescription>
                        Manage department information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        {navItems.slice(1).map((item) => {
                          const Icon = item.icon;
                          return (
                            <Button
                              key={item.id}
                              variant="outline"
                              className="w-full justify-start h-12 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
                              onClick={() => setActiveTab(item.id)}
                            >
                              <Icon className="mr-3 h-5 w-5" />
                              <span className="font-medium">{item.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Info className="h-5 w-5" />
                      System Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">🔒 Security</h4>
                        <p className="text-sm text-blue-800">
                          All data is encrypted and stored securely. Department credentials are shown only once during creation.
                        </p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2">🔄 Real-Time Sync</h4>
                        <p className="text-sm text-green-800">
                          All changes sync automatically with the AI assistant, notice board, and department panels.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "general" && <GeneralInfoSectionNew />}
            {activeTab === "courses" && <CoursesSection />}
            {activeTab === "syllabus" && <SyllabusManager />}
            {activeTab === "staff" && <StaffSection />}
            {activeTab === "departments" && <DepartmentsManager />}
            {activeTab === "events" && <EventsManager />}
            {activeTab === "updates" && <UpdatesAdminSection />}
          </div>
        </main>
      </div>
    </div>
  );
}
