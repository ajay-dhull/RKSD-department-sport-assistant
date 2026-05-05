import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useVoice } from "@/hooks/use-voice";
import { Plus, Edit, Trash2, Sparkles, Mic, MicOff, Loader2, ChevronDown, GraduationCap } from "lucide-react";
import { EnhancedAIInput } from "./EnhancedAIInput";
import { EnhancedAIPreview } from "./EnhancedAIPreview";

interface Course {
  id: string;
  course_name: string;
  course_code: string;
  course_type: string;
  duration: string;
  description: string;
  eligibility: string;
  total_seats: number;
  fees_per_year: number;
  department_id: string;
  is_active: boolean;
}

export function CoursesSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [formData, setFormData] = useState({
    course_name: "",
    course_code: "",
    course_type: "UG",
    duration: "",
    description: "",
    eligibility: "",
    total_seats: "",
    fees_per_year: "",
  });

  const token = localStorage.getItem("adminToken");

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    browserSupported,
  } = useVoice();

  const { data: coursesData } = useQuery<{ courses: Course[] }>({
    queryKey: ["/api/admin/courses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch courses");
      return await res.json();
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create course");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Success", description: "Course created successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update course");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Success", description: "Course updated successfully" });
      setEditingCourse(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete course");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ title: "Success", description: "Course deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (transcript && isAiMode) {
      setAiPrompt(transcript);
    }
  }, [transcript, isAiMode]);

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description or use voice input",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/ai-generate-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate course");
      }

      const data = await res.json();
      setAiGeneratedData(data);
      toast({
        title: "Success",
        description: "Course information generated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate course",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmAI = async () => {
    if (!aiGeneratedData) return;
    
    const entries = aiGeneratedData.entries || [aiGeneratedData];
    
    try {
      for (const entry of entries) {
        const normalizedEntry = {
          ...entry,
          total_seats: entry.total_seats?.toString() || "0",
          fees_per_year: entry.fees_per_year?.toString() || "0",
        };
        
        const res = await fetch("/api/admin/courses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(normalizedEntry),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Failed to add course' }));
          throw new Error(errorData.message || `Failed to add course: ${entry.course_name}`);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({ 
        title: "Success", 
        description: `${entries.length} course(s) added successfully` 
      });
      
      setAiPrompt("");
      setAiGeneratedData(null);
      setCurrentPreviewIndex(0);
      setIsAiMode(false);
      setIsCreateOpen(false);
      resetTranscript();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add courses", 
        variant: "destructive" 
      });
    }
  };

  const handleEditEntry = (entry: any, index: number) => {
    setFormData({
      course_name: entry.course_name || "",
      course_code: entry.course_code || "",
      course_type: entry.course_type || "UG",
      duration: entry.duration || "",
      description: entry.description || "",
      eligibility: entry.eligibility || "",
      total_seats: entry.total_seats?.toString() || "",
      fees_per_year: entry.fees_per_year?.toString() || "",
    });
    
    setAiGeneratedData(null);
    setIsAiMode(false);
    setCurrentPreviewIndex(0);
  };

  const handleDeleteEntry = (index: number) => {
    if (!aiGeneratedData) return;
    
    const entries = aiGeneratedData.entries || [aiGeneratedData];
    const updatedEntries = entries.filter((_: any, i: number) => i !== index);
    
    if (updatedEntries.length === 0) {
      setAiGeneratedData(null);
      setCurrentPreviewIndex(0);
      toast({
        title: "Info",
        description: "All entries removed. You can generate new ones.",
      });
    } else {
      setAiGeneratedData({ entries: updatedEntries });
      if (currentPreviewIndex >= updatedEntries.length) {
        setCurrentPreviewIndex(updatedEntries.length - 1);
      }
      toast({
        title: "Success",
        description: "Entry removed from preview",
      });
    }
  };

  const handleRegenerateAI = () => {
    setAiGeneratedData(null);
    setCurrentPreviewIndex(0);
  };

  const resetForm = () => {
    setFormData({
      course_name: "",
      course_code: "",
      course_type: "UG",
      duration: "",
      description: "",
      eligibility: "",
      total_seats: "",
      fees_per_year: "",
    });
    setAiPrompt("");
    setAiGeneratedData(null);
    setCurrentPreviewIndex(0);
    resetTranscript();
  };

  const handleOpenDialog = (mode: 'manual' | 'ai') => {
    setIsAiMode(mode === 'ai');
    setIsCreateOpen(true);
    setAiPrompt("");
    setAiGeneratedData(null);
    setCurrentPreviewIndex(0);
    resetTranscript();
  };

  const handleSubmit = () => {
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      course_name: course.course_name,
      course_code: course.course_code,
      course_type: course.course_type,
      duration: course.duration,
      description: course.description,
      eligibility: course.eligibility,
      total_seats: course.total_seats.toString(),
      fees_per_year: course.fees_per_year.toString(),
    });
  };

  const courses = coursesData?.courses || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Courses Detail</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage college courses and programs</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Course
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenDialog('manual')}>
              Manual Mode
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenDialog('ai')}>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Mode (Smart Add)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {isAiMode ? "AI Mode - Add Course" : "Add New Course"}
            </DialogTitle>
          </DialogHeader>
          
          {isAiMode ? (
            <div className="space-y-4">
              {!aiGeneratedData ? (
                <EnhancedAIInput
                  prompt={aiPrompt}
                  onPromptChange={setAiPrompt}
                  onGenerate={handleGenerateAI}
                  isGenerating={isGenerating}
                  isListening={isListening}
                  onToggleVoice={handleToggleVoice}
                  browserSupported={browserSupported}
                  placeholder="Describe courses you want to add - single or multiple..."
                  examples={[
                    "Add B.Sc Computer Science, 3-year UG program, 60 seats, ₹25,000 per year fees",
                    "Add three courses: B.A. in English, B.Com in Commerce, and B.Sc in Mathematics",
                    "M.Sc Physics, 2 years PG course, 30 seats, fees 35000 rupees yearly"
                  ]}
                  sectionType="courses"
                />
              ) : (
                <EnhancedAIPreview
                  entries={aiGeneratedData.entries || [aiGeneratedData]}
                  currentIndex={currentPreviewIndex}
                  onIndexChange={setCurrentPreviewIndex}
                  renderPreview={(course) => (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        <div>
                          <span className="font-semibold text-gray-700">Course Name:</span>
                          <p className="text-gray-900">{course.course_name}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Course Code:</span>
                          <p className="text-gray-900">{course.course_code}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Type:</span>
                          <p className="text-gray-900">{course.course_type}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Duration:</span>
                          <p className="text-gray-900">{course.duration}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Total Seats:</span>
                          <p className="text-gray-900">{course.total_seats}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Fees Per Year:</span>
                          <p className="text-gray-900">₹{course.fees_per_year}</p>
                        </div>
                      </div>
                      {course.description && (
                        <div className="mt-4 pt-3 border-t">
                          <span className="font-semibold text-gray-700 block mb-1">Description:</span>
                          <p className="text-gray-900">{course.description}</p>
                        </div>
                      )}
                      {course.eligibility && (
                        <div className="mt-3">
                          <span className="font-semibold text-gray-700 block mb-1">Eligibility:</span>
                          <p className="text-gray-900">{course.eligibility}</p>
                        </div>
                      )}
                    </div>
                  )}
                  onConfirmAll={handleConfirmAI}
                  onRegenerate={handleRegenerateAI}
                  onEditEntry={handleEditEntry}
                  onDeleteEntry={handleDeleteEntry}
                  confirmButtonText={`Add ${(aiGeneratedData.entries || [aiGeneratedData]).length} Course${(aiGeneratedData.entries || [aiGeneratedData]).length > 1 ? 's' : ''}`}
                  entryTypeName="Course"
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Course Name</Label>
                  <Input
                    value={formData.course_name}
                    onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                    placeholder="e.g., Bachelor of Arts"
                  />
                </div>
                <div>
                  <Label>Course Code</Label>
                  <Input
                    value={formData.course_code}
                    onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                    placeholder="e.g., BA-001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Course Type</Label>
                  <Select
                    value={formData.course_type}
                    onValueChange={(value) => setFormData({ ...formData, course_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 3 Years"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Total Seats</Label>
                  <Input
                    type="number"
                    value={formData.total_seats}
                    onChange={(e) => setFormData({ ...formData, total_seats: e.target.value })}
                    placeholder="e.g., 60"
                  />
                </div>
                <div>
                  <Label>Fees Per Year (₹)</Label>
                  <Input
                    type="number"
                    value={formData.fees_per_year}
                    onChange={(e) => setFormData({ ...formData, fees_per_year: e.target.value })}
                    placeholder="e.g., 25000"
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Course description..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Eligibility</Label>
                <Textarea
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="Eligibility criteria..."
                  rows={2}
                />
              </div>
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={!formData.course_name || !formData.course_code}
              >
                Create Course
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Course Name</Label>
                <Input
                  value={formData.course_name}
                  onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Course Code</Label>
                <Input
                  value={formData.course_code}
                  onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Course Type</Label>
                <Select
                  value={formData.course_type}
                  onValueChange={(value) => setFormData({ ...formData, course_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Total Seats</Label>
                <Input
                  type="number"
                  value={formData.total_seats}
                  onChange={(e) => setFormData({ ...formData, total_seats: e.target.value })}
                />
              </div>
              <div>
                <Label>Fees Per Year (₹)</Label>
                <Input
                  type="number"
                  value={formData.fees_per_year}
                  onChange={(e) => setFormData({ ...formData, fees_per_year: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Eligibility</Label>
              <Textarea
                value={formData.eligibility}
                onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                rows={2}
              />
            </div>
            <Button onClick={handleSubmit} className="w-full">
              Update Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {courses.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-base sm:text-lg font-medium mb-2">No courses added yet</p>
            <p className="text-gray-400 text-sm">Click "Add Course" button above to create your first course</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden lg:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Course Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type & Duration
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Seats & Fees
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900">{course.course_name}</p>
                            <p className="text-xs text-gray-500 font-mono">{course.course_code}</p>
                            {course.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{course.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {course.course_type}
                            </span>
                            <p className="text-sm text-gray-700">{course.duration}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1 text-gray-700">
                              <span className="font-medium">Seats:</span>
                              <span>{course.total_seats || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-700">
                              <span className="font-medium">Fees:</span>
                              <span>₹{course.fees_per_year?.toLocaleString() || 'N/A'}/year</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => startEdit(course)}
                              className="hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteMutation.mutate(course.id)}
                              className="hover:bg-red-50 hover:border-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg text-gray-900 break-words">
                        {course.course_name}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm font-mono mt-1">
                        {course.course_code}
                      </CardDescription>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white whitespace-nowrap flex-shrink-0">
                      {course.course_type}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {course.description && (
                    <div className="pb-3 border-b border-gray-100">
                      <p className="text-sm text-gray-600 line-clamp-3">{course.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <span className="font-semibold">Duration:</span>
                        <span className="text-gray-900">{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <span className="font-semibold">Seats:</span>
                        <span className="text-gray-900">{course.total_seats || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-gray-700">Fees/Year:</span>
                        <span className="text-green-600 font-semibold">
                          ₹{course.fees_per_year?.toLocaleString() || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {course.eligibility && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold">Eligibility: </span>
                        {course.eligibility}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3">
                    <Button 
                      size="sm"
                      variant="outline" 
                      onClick={() => startEdit(course)}
                      className="flex-1 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 h-9"
                    >
                      <Edit className="h-4 w-4 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(course.id)}
                      className="flex-1 hover:bg-red-50 hover:border-red-500 hover:text-red-700 h-9"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
