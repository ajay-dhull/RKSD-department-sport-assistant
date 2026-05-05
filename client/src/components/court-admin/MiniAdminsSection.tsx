import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, UserCog, ExternalLink, Eye, RefreshCw, Shield } from "lucide-react";

interface MiniAdminData {
  id?: string;
  name: string;
  username: string;
  password?: string;
  role: string;
  scope_type?: string;
  scope_value?: string;
  email?: string;
}

export function MiniAdminsSection() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [selectedMiniAdmin, setSelectedMiniAdmin] = useState<any>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [newCredentials, setNewCredentials] = useState<any>(null);
  const [formData, setFormData] = useState<MiniAdminData>({
    name: "",
    username: "",
    role: "",
    scope_type: "",
    scope_value: "",
    email: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: miniAdminsData } = useQuery({
    queryKey: ["/api/court-admin/mini-admins"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/mini-admins");
      if (!res.ok) throw new Error("Failed to fetch mini admins");
      return await res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MiniAdminData) => {
      const res = await fetch("/api/court-admin/mini-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create mini admin");
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/mini-admins"] });
      setNewCredentials(data.credentials);
      toast({ title: "Success", description: "Mini admin created successfully" });
      resetForm();
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async ({ id, adminPassword }: { id: string; adminPassword: string }) => {
      const res = await fetch(`/api/court-admin/mini-admins/${id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to regenerate password");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Success", 
        description: `New password: ${data.newPassword}`,
        duration: 10000,
      });
      setIsPasswordPromptOpen(false);
      setAdminPassword("");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/court-admin/mini-admins/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete mini admin");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/mini-admins"] });
      toast({ title: "Success", description: "Mini admin deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      role: "",
      scope_type: "",
      scope_value: "",
      email: "",
    });
    setIsCreateOpen(false);
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const handleRegeneratePassword = () => {
    if (selectedMiniAdmin && adminPassword) {
      regenerateMutation.mutate({ id: selectedMiniAdmin.id, adminPassword });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Mini-Admins Management</h3>
          <p className="text-sm text-gray-600 mt-1">Create and manage mini admin accounts with limited scope access</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Mini-Admin
        </Button>
      </div>

      {newCredentials && (
        <Alert className="bg-green-50 border-green-200">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <p className="font-bold text-green-900 mb-2">New Mini-Admin Created!</p>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Username:</span> {newCredentials.username}</p>
              <p><span className="font-medium">Password:</span> {newCredentials.password}</p>
              <p><span className="font-medium">Panel Link:</span> {newCredentials.panel_link}</p>
            </div>
            <p className="text-xs text-green-700 mt-2">Please save these credentials. The password won't be shown again.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setNewCredentials(null)}>
              Close
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {miniAdminsData?.miniAdmins?.map((miniAdmin: any) => (
          <Card key={miniAdmin.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserCog className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{miniAdmin.name}</h4>
                  <p className="text-xs text-gray-600">@{miniAdmin.username}</p>
                  <p className="text-sm text-gray-700 mt-1">{miniAdmin.role}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {miniAdmin.scope_type && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Scope:</span> {miniAdmin.scope_type} - {miniAdmin.scope_value}
                  </p>
                )}
                {miniAdmin.email && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Email:</span> {miniAdmin.email}
                  </p>
                )}
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Panel Link:</span> {miniAdmin.panel_link}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedMiniAdmin(miniAdmin);
                    setIsPasswordPromptOpen(true);
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(miniAdmin.panel_link, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open Panel
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => deleteMutation.mutate(miniAdmin.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!miniAdminsData?.miniAdmins || miniAdminsData.miniAdmins.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center text-gray-500">
              No mini admins found. Click "Create Mini-Admin" to create one.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Mini-Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Building A Admin"
                />
              </div>
              <div>
                <Label>Username *</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g., buildinga_admin"
                />
              </div>
            </div>

            <div>
              <Label>Role *</Label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Building Manager, Department Head"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Scope Type</Label>
                <Input
                  value={formData.scope_type}
                  onChange={(e) => setFormData({ ...formData, scope_type: e.target.value })}
                  placeholder="e.g., building, department"
                />
              </div>
              <div>
                <Label>Scope Value</Label>
                <Input
                  value={formData.scope_value}
                  onChange={(e) => setFormData({ ...formData, scope_value: e.target.value })}
                  placeholder="e.g., Building A, Civil Dept"
                />
              </div>
            </div>

            <div>
              <Label>Email (Optional)</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.username || !formData.role || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Mini-Admin"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordPromptOpen} onOpenChange={setIsPasswordPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Main Admin Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                For security reasons, please enter your main admin password to regenerate credentials.
              </AlertDescription>
            </Alert>
            <div>
              <Label>Main Admin Password *</Label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter main admin password"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsPasswordPromptOpen(false);
                setAdminPassword("");
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleRegeneratePassword}
                disabled={!adminPassword || regenerateMutation.isPending}
              >
                {regenerateMutation.isPending ? "Regenerating..." : "Regenerate Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
