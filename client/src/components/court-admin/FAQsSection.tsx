import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MessageSquare } from "lucide-react";

interface FAQData {
  id?: string;
  question: string;
  answer: string;
  category: string;
  department_id?: string | null;
  is_head_editable?: boolean;
  priority?: number;
}

export function FAQsSection() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQData | null>(null);
  const [formData, setFormData] = useState<FAQData>({
    question: "",
    answer: "",
    category: "General",
    department_id: null,
    is_head_editable: false,
    priority: 0,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: faqsData } = useQuery({
    queryKey: ["/api/court-admin/faqs"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/faqs");
      if (!res.ok) throw new Error("Failed to fetch FAQs");
      return await res.json();
    },
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["/api/court-admin/departments"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      return await res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FAQData) => {
      const res = await fetch("/api/court-admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create FAQ");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/faqs"] });
      toast({ title: "Success", description: "FAQ created successfully" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: FAQData & { id: string }) => {
      const res = await fetch(`/api/court-admin/faqs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update FAQ");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/faqs"] });
      toast({ title: "Success", description: "FAQ updated successfully" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/court-admin/faqs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete FAQ");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/faqs"] });
      toast({ title: "Success", description: "FAQ deleted successfully" });
    },
  });

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "General",
      department_id: null,
      is_head_editable: false,
      priority: 0,
    });
    setIsCreateOpen(false);
    setEditingFAQ(null);
  };

  const handleSubmit = () => {
    if (editingFAQ?.id) {
      updateMutation.mutate({ ...formData, id: editingFAQ.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (faq: any) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      department_id: faq.department_id || null,
      is_head_editable: faq.is_head_editable || false,
      priority: faq.priority || 0,
    });
    setIsCreateOpen(true);
  };

  const categories = ["General", "Timings", "Documents", "Directions", "Procedures", "Announcements"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">FAQs & Content Management</h3>
          <p className="text-sm text-gray-600 mt-1">Manage frequently asked questions for the court assistant</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add FAQ
        </Button>
      </div>

      <div className="space-y-4">
        {faqsData?.faqs?.map((faq: any) => (
          <Card key={faq.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                      {faq.category}
                    </span>
                    {faq.priority > 0 && (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                        Priority: {faq.priority}
                      </span>
                    )}
                    {faq.is_head_editable && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        Head Editable
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{faq.question}</h4>
                  <p className="text-sm text-gray-700">{faq.answer}</p>
                  {faq.department && (
                    <p className="text-xs text-gray-600 mt-2">
                      <span className="font-medium">Department:</span> {faq.department.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(faq)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(faq.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!faqsData?.faqs || faqsData.faqs.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              No FAQs found. Click "Add FAQ" to create one.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFAQ ? "Edit FAQ" : "Add New FAQ"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Question *</Label>
              <Textarea
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the frequently asked question"
                rows={2}
              />
            </div>

            <div>
              <Label>Answer *</Label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter the answer"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority (0-10)</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Department (Optional)</Label>
              <Select value={formData.department_id || ""} onValueChange={(value) => setFormData({ ...formData, department_id: value || null })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (General)</SelectItem>
                  {departmentsData?.departments?.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="head-editable"
                checked={formData.is_head_editable}
                onCheckedChange={(checked) => setFormData({ ...formData, is_head_editable: checked })}
              />
              <Label htmlFor="head-editable" className="cursor-pointer">
                Mark as Head-Editable Only
              </Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.question || !formData.answer || createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingFAQ ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
