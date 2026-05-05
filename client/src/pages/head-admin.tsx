import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, Home, Building2, Bell, Calendar } from "lucide-react";
import { DashboardStats } from "@/components/head-admin/DashboardStats";
import { DepartmentsManager } from "@/components/head-admin/DepartmentsManager";
import { NoticesManager } from "@/components/head-admin/NoticesManager";
import { EventsManager } from "@/components/head-admin/EventsManager";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "departments", label: "Departments", icon: Building2 },
  { id: "notices", label: "Notices", icon: Bell },
  { id: "events", label: "Events", icon: Calendar },
];

export default function HeadAdminPanel() {
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
        <h2 className="text-2xl font-bold text-gray-900">Head Admin</h2>
        <p className="text-sm text-gray-600">College Management</p>
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
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
          <NavContent />
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
            <h1 className="text-xl font-bold text-gray-900">Head Admin</h1>
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
          </div>

          <div className="p-6">
            {activeTab === "dashboard" && <DashboardStats />}
            {activeTab === "departments" && <DepartmentsManager />}
            {activeTab === "notices" && <NoticesManager />}
            {activeTab === "events" && <EventsManager />}
          </div>
        </main>
      </div>
    </div>
  );
}
