import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Home, 
  Building2, 
  GraduationCap, 
  Calendar, 
  Trophy, 
  Library, 
  Users,
  Menu,
  Save,
  Info,
  LogOut
} from "lucide-react";
import { GeneralInfoSection } from "@/components/admin/GeneralInfoSection";
import { DepartmentsSection } from "@/components/admin/DepartmentsSection";
import { ClassesSection } from "@/components/admin/ClassesSection";
import { EventsSection } from "@/components/admin/EventsSection";
import { FacilitiesSection } from "@/components/admin/FacilitiesSection";
import { AdmissionsSection } from "@/components/admin/AdmissionsSection";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "general", label: "General Info", icon: Info },
  { id: "departments", label: "Departments", icon: Building2 },
  { id: "classes", label: "Classes & Schedule", icon: GraduationCap },
  { id: "events", label: "Events & Activities", icon: Calendar },
  { id: "facilities", label: "Facilities", icon: Library },
  { id: "admissions", label: "Admissions", icon: Users },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setLocation("/admin/login");
  };

  const NavContent = () => (
    <div className="space-y-2 p-4 flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
        <p className="text-sm text-gray-600">College Management System</p>
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
        <h1 className="ml-4 text-lg font-semibold">Admin Panel</h1>
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
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600 mt-2">
                    Welcome to the College Management Admin Panel
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Students
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">5,200</div>
                      <p className="text-xs text-gray-500 mt-1">Active students</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Faculty
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">41</div>
                      <p className="text-xs text-gray-500 mt-1">Teaching staff</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Courses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">28</div>
                      <p className="text-xs text-gray-500 mt-1">UG & PG programs</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Manage your college information from the sections below
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {navItems.slice(1).map((item) => {
                        const Icon = item.icon;
                        return (
                          <Button
                            key={item.id}
                            variant="outline"
                            className="justify-start h-auto py-3"
                            onClick={() => setActiveTab(item.id)}
                          >
                            <Icon className="mr-2 h-5 w-5" />
                            <span>{item.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "general" && <GeneralInfoSection />}
            {activeTab === "departments" && <DepartmentsSection />}
            {activeTab === "classes" && <ClassesSection />}
            {activeTab === "events" && <EventsSection />}
            {activeTab === "facilities" && <FacilitiesSection />}
            {activeTab === "admissions" && <AdmissionsSection />}
          </div>
        </main>
      </div>
    </div>
  );
}
