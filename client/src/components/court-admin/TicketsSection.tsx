import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Edit, Trash2, CheckCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface TicketData {
  id?: string;
  question: string;
  source?: string;
  status?: string;
  assigned_to?: string | null;
  resolution_notes?: string;
}

export function TicketsSection() {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [status, setStatus] = useState("Pending");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ticketsData } = useQuery({
    queryKey: ["/api/court-admin/tickets"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/tickets");
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return await res.json();
    },
  });

  const { data: miniAdminsData } = useQuery({
    queryKey: ["/api/court-admin/mini-admins"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/mini-admins");
      if (!res.ok) throw new Error("Failed to fetch mini admins");
      return await res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: TicketData & { id: string }) => {
      const res = await fetch(`/api/court-admin/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update ticket");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/tickets"] });
      toast({ title: "Success", description: "Ticket updated successfully" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/court-admin/tickets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete ticket");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/tickets"] });
      toast({ title: "Success", description: "Ticket deleted successfully" });
    },
  });

  const resetForm = () => {
    setResolutionNotes("");
    setAssignedTo(null);
    setStatus("Pending");
    setIsEditOpen(false);
    setEditingTicket(null);
  };

  const handleEdit = (ticket: any) => {
    setEditingTicket(ticket);
    setResolutionNotes(ticket.resolution_notes || "");
    setAssignedTo(ticket.assigned_to || null);
    setStatus(ticket.status || "Pending");
    setIsEditOpen(true);
  };

  const handleSubmit = () => {
    if (editingTicket?.id) {
      updateMutation.mutate({
        id: editingTicket.id,
        question: editingTicket.question,
        source: editingTicket.source,
        status,
        assigned_to: assignedTo,
        resolution_notes: resolutionNotes,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Review': return 'bg-blue-100 text-blue-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingTickets = ticketsData?.tickets?.filter((t: any) => t.status === 'Pending') || [];
  const allTickets = ticketsData?.tickets || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Unanswered Queries & Tickets</h3>
          <p className="text-sm text-gray-600 mt-1">
            Questions that the assistant couldn't answer automatically
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{pendingTickets.length}</p>
              <p className="text-sm text-gray-600 mt-1">Pending Tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {allTickets.filter((t: any) => t.status === 'In Review').length}
              </p>
              <p className="text-sm text-gray-600 mt-1">In Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {allTickets.filter((t: any) => t.status === 'Resolved').length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {allTickets.map((ticket: any) => (
          <Card key={ticket.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Ticket className="w-5 h-5 text-purple-600" />
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {ticket.source || 'web'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(ticket.created_at), 'PPp')}
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-gray-900 mb-2">{ticket.question}</h4>
                  
                  {ticket.assigned && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Assigned to:</span> {ticket.assigned.name}
                    </p>
                  )}
                  
                  {ticket.resolution_notes && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs font-medium text-green-900 mb-1">Resolution Notes:</p>
                      <p className="text-sm text-green-800">{ticket.resolution_notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(ticket)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(ticket.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {allTickets.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>No unanswered queries! The assistant is handling everything well.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Question</Label>
              <p className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-900">
                {editingTicket?.question}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Review">In Review</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assign To</Label>
                <Select value={assignedTo || ""} onValueChange={(value) => setAssignedTo(value || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mini admin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {miniAdminsData?.miniAdmins?.map((admin: any) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Resolution Notes</Label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter resolution notes or how this was addressed"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Ticket"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
