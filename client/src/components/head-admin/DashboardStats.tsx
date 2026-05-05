import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Bell, Calendar, TrendingUp, Activity, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function DashboardStats() {
  const queryClient = useQueryClient();
  
  const { data: stats } = useQuery({
    queryKey: ['/api/head-admin/stats'],
    queryFn: async () => {
      const res = await fetch('/api/head-admin/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  useEffect(() => {
    const departmentsChannel = supabase
      .channel('dashboard-departments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'departments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['/api/head-admin/stats'] });
        }
      )
      .subscribe();

    const noticesChannel = supabase
      .channel('dashboard-notices')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notices' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['/api/head-admin/stats'] });
        }
      )
      .subscribe();

    const eventsChannel = supabase
      .channel('dashboard-events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['/api/head-admin/stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(departmentsChannel);
      supabase.removeChannel(noticesChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [queryClient]);

  const statCards = [
    {
      title: "Total Departments",
      value: stats?.total_departments || 0,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-50",
      borderColor: "border-blue-200",
      iconBg: "bg-blue-500",
      description: "Active department panels"
    },
    {
      title: "Active Notices",
      value: stats?.active_notices || 0,
      icon: Bell,
      color: "text-green-600",
      bg: "bg-green-50",
      borderColor: "border-green-200",
      iconBg: "bg-green-500",
      description: "Published announcements"
    },
    {
      title: "Upcoming Events",
      value: stats?.upcoming_events || 0,
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
      borderColor: "border-purple-200",
      iconBg: "bg-purple-500",
      description: "Scheduled activities"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Head Admin Dashboard
          </h2>
          <p className="text-gray-600 mt-2">
            R.K.S.D. (PG) College - Master Control Panel
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
          <Activity className="h-4 w-4 text-green-600 animate-pulse" />
          <span className="text-sm font-medium text-green-700">Real-Time Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={`bg-gradient-to-br from-white to-${stat.bg.replace('bg-', '')} ${stat.borderColor} hover:shadow-xl transition-all duration-300`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm font-semibold ${stat.color.replace('text-', 'text-')}`}>
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 ${stat.iconBg} rounded-lg shadow-md`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 ${stat.iconBg} rounded-full`}></span>
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="border-b bg-white/50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <TrendingUp className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>Follow these steps to manage your college</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Create Departments</h4>
                  <p className="text-sm text-blue-800 mt-1">Set up department panels from the "Departments" tab</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Share Credentials</h4>
                  <p className="text-sm text-blue-800 mt-1">Send generated ID & password to department heads securely</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Publish Content</h4>
                  <p className="text-sm text-blue-800 mt-1">Create notices and events for the digital notice board</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Monitor & Manage</h4>
                  <p className="text-sm text-blue-800 mt-1">All updates sync instantly with AI assistant and panels</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="border-b bg-white/50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Shield className="h-5 w-5" />
              System Features
            </CardTitle>
            <CardDescription>Key capabilities of your management system</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  🔒 Enterprise Security
                </h4>
                <p className="text-sm text-blue-800">
                  All data is encrypted. Department credentials are shown only once during creation for maximum security.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  🔄 Real-Time Synchronization
                </h4>
                <p className="text-sm text-green-800">
                  All changes instantly sync across AI assistant, notice board, and department panels - no delays.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  🤖 AI-Powered Assistant
                </h4>
                <p className="text-sm text-purple-800">
                  Ram AI assistant has instant access to all departments, staff, courses, events, and notices data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Bell className="h-5 w-5" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-gray-900 mb-2">📱 Mobile Friendly</h4>
              <p className="text-sm text-gray-700">
                Department heads can manage their panels from any device - desktop, tablet, or mobile.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border-l-4 border-green-500">
              <h4 className="font-semibold text-gray-900 mb-2">🔗 Unique Panel Links</h4>
              <p className="text-sm text-gray-700">
                Each department gets a private, secure link. Only authorized users with credentials can access.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border-l-4 border-purple-500">
              <h4 className="font-semibold text-gray-900 mb-2">📊 Live Dashboard</h4>
              <p className="text-sm text-gray-700">
                Monitor all department activities, notices, and events in real-time from this dashboard.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border-l-4 border-orange-500">
              <h4 className="font-semibold text-gray-900 mb-2">🎯 No Technical Skills Needed</h4>
              <p className="text-sm text-gray-700">
                Simple, intuitive interface designed for educators, not technicians. Anyone can use it.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
