import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Building, DoorOpen, Users, Building2, Ticket, MessageSquare } from "lucide-react";

export function DashboardSection() {
  const { data: stats } = useQuery({
    queryKey: ["/api/court-admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return await res.json();
    },
  });

  const statCards = [
    { title: "Total Buildings", value: stats?.buildings || 0, icon: Building, color: "purple" },
    { title: "Total Rooms", value: stats?.rooms || 0, icon: DoorOpen, color: "violet" },
    { title: "Staff Members", value: stats?.staff || 0, icon: Users, color: "indigo" },
    { title: "Departments", value: stats?.departments || 0, icon: Building2, color: "blue" },
    { title: "Pending Tickets", value: stats?.pending_tickets || 0, icon: Ticket, color: "red" },
    { title: "FAQs", value: stats?.faqs || 0, icon: MessageSquare, color: "green" },
  ];

  const colorClasses: Record<string, { border: string; bg: string; text: string }> = {
    purple: { border: 'border-purple-500', bg: 'bg-purple-100', text: 'text-purple-600' },
    violet: { border: 'border-violet-500', bg: 'bg-violet-100', text: 'text-violet-600' },
    indigo: { border: 'border-indigo-500', bg: 'bg-indigo-100', text: 'text-indigo-600' },
    blue: { border: 'border-blue-500', bg: 'bg-blue-100', text: 'text-blue-600' },
    red: { border: 'border-red-500', bg: 'bg-red-100', text: 'text-red-600' },
    green: { border: 'border-green-500', bg: 'bg-green-100', text: 'text-green-600' },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const classes = colorClasses[stat.color];
          const Icon = stat.icon;
          
          return (
            <Card key={stat.title} className={`border-l-4 ${classes.border} shadow-md`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${classes.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={classes.text} size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900">Add Building</h4>
              <p className="text-sm text-purple-700 mt-1">Create new court building</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900">Add Staff</h4>
              <p className="text-sm text-blue-700 mt-1">Register new staff member</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900">Add FAQ</h4>
              <p className="text-sm text-green-700 mt-1">Create new FAQ entry</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Court Information Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Court Name</span>
              <span className="text-sm text-gray-900">Kaithal District Court</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Working Hours</span>
              <span className="text-sm text-gray-900">10:00 AM - 5:00 PM</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Lunch Break</span>
              <span className="text-sm text-gray-900">1:00 PM - 2:00 PM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
