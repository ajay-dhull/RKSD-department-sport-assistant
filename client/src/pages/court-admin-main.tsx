import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Home, 
  Building2, 
  DoorOpen,
  Menu,
  LogOut,
  Info,
  Users,
  UserCog,
  MessageSquare,
  Ticket,
  Megaphone,
  Settings,
  Building
} from "lucide-react";
import { DashboardSection } from "@/components/court-admin/DashboardSection";
import { GeneralInfoSection } from "@/components/court-admin/GeneralInfoSection";
import { BuildingsSection } from "@/components/court-admin/BuildingsSection";
import { RoomsSection } from "@/components/court-admin/RoomsSection";
import { DepartmentsSection } from "@/components/court-admin/DepartmentsSection";
import { StaffSection } from "@/components/court-admin/StaffSection";
import { MiniAdminsSection } from "@/components/court-admin/MiniAdminsSection";
import { FAQsSection } from "@/components/court-admin/FAQsSection";
import { TicketsSection } from "@/components/court-admin/TicketsSection";
import { AnnouncementsSection } from "@/components/court-admin/AnnouncementsSection";
import { SettingsSection } from "@/components/court-admin/SettingsSection";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "general", label: "General Info", icon: Info },
  { id: "buildings", label: "Buildings", icon: Building },
  { id: "rooms", label: "Rooms & Courtrooms", icon: DoorOpen },
  { id: "departments", label: "Departments", icon: Building2 },
  { id: "staff", label: "Staff Directory", icon: Users },
  { id: "mini-admins", label: "Mini-Admins", icon: UserCog },
  { id: "faqs", label: "FAQs & Content", icon: MessageSquare },
  { id: "tickets", label: "Unanswered Queries", icon: Ticket },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function CourtAdminMain() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const adminId = localStorage.getItem("courtAdminId");
  const adminUsername = localStorage.getItem("courtAdminUsername");

  useEffect(() => {
    if (!adminId) {
      setLocation("/court-admin-login");
    }
  }, [adminId, setLocation]);

  // Real-time subscription for updates (like RKSD)
  useEffect(() => {
    const channels = [
      supabase.channel('court-buildings-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'court_buildings' }, () => {
          queryClient.invalidateQueries({ queryKey: ["/api/court-admin/buildings"] });
          queryClient.invalidateQueries({ queryKey: ["/api/court-admin/stats"] });
        })
        .subscribe(),
      
      supabase.channel('court-rooms-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'court_rooms' }, () => {
          queryClient.invalidateQueries({ queryKey: ["/api/court-admin/rooms"] });
          queryClient.invalidateQueries({ queryKey: ["/api/court-admin/stats"] });
        })
        .subscribe(),
      
      supabase.channel('court-staff-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'court_staff' }, () => {
          queryClient.invalidateQueries({ queryKey: ["/api/court-admin/staff"] });
          queryClient.invalidateQueries({ queryKey: ["/api/court-admin/stats"] });
        })
        .subscribe(),
      
      supabase.channel('court-departments-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'court_departments' }, () => {
          queryClient.invalidateQueries({ queryKey: ["/api/court-admin/departments"] });
          queryClient.invalidateQueries({ queryKey: ["/api/court-admin/stats"] });
        })
        .subscribe(),

      supabase.channel('court-faqs-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'court_faqs' }, () => {
          queryClient.invalidateQueries({ queryKey: ["/api/court-admin/faqs"] });
        })
        .subscribe(),

      supabase.channel('court-tickets-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'court_tickets' }, () => {
          queryClient.invalidateQueries({ queryKey: ["/api/court-admin/tickets"] });
          queryClient.invalidateQueries({ queryKey: ["/api/court-admin/stats"] });
        })
        .subscribe(),

      supabase.channel('court-announcements-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'court_announcements' }, () => {
          queryClient.invalidateQueries({ queryKey: ["/api/court-admin/announcements"] });
        })
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [queryClient]);

  const handleLogout = () => {
    localStorage.removeItem("courtAdminId");
    localStorage.removeItem("courtAdminUsername");
    setLocation("/court-admin-login");
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-purple-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <Building2 className="w-6 h-6 text-purple-900" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Court Admin</h1>
            <p className="text-xs text-purple-200">Kaithal District Court</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id
                  ? 'bg-white text-purple-900 shadow-lg'
                  : 'text-purple-100 hover:bg-purple-800'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-purple-700">
        <div className="mb-3 px-4 py-2 bg-purple-800 rounded-lg">
          <p className="text-xs text-purple-200">Logged in as:</p>
          <p className="text-sm text-white font-medium">{adminUsername}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-purple-800 transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 bg-gradient-to-b from-purple-900 to-violet-900 text-white shadow-2xl flex-col">
          <NavContent />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden fixed top-4 left-4 z-40">
            <Button size="icon" variant="outline">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-gradient-to-b from-purple-900 to-violet-900 text-white">
            <NavContent />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="md:hidden">
                    <Button size="icon" variant="ghost">
                      <Menu />
                    </Button>
                  </SheetTrigger>
                </Sheet>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    {navItems.find(i => i.id === activeTab)?.label}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    Manage court data and information
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 md:p-8">
            {activeTab === 'dashboard' && <DashboardSection />}
            {activeTab === 'general' && <GeneralInfoSection />}
            {activeTab === 'buildings' && <BuildingsSection />}
            {activeTab === 'rooms' && <RoomsSection />}
            {activeTab === 'departments' && <DepartmentsSection />}
            {activeTab === 'staff' && <StaffSection />}
            {activeTab === 'mini-admins' && <MiniAdminsSection />}
            {activeTab === 'faqs' && <FAQsSection />}
            {activeTab === 'tickets' && <TicketsSection />}
            {activeTab === 'announcements' && <AnnouncementsSection />}
            {activeTab === 'settings' && <SettingsSection />}
          </div>
        </div>
      </div>
    </div>
  );
}
