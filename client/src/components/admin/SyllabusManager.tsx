import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Plus, Edit, Trash2, ArrowLeft, ChevronDown, ChevronUp,
  Loader2, FlaskConical, BookMarked
} from "lucide-react";

interface SyllabusCourse {
  id: string;
  semester: string;
  course_code: string;
  course_name: string;
  course_type: string;
  theory_credits: number;
  practical_credits: number;
  total_credits: number;
  contact_hours: number;
  max_marks: number;
}

interface CourseContent {
  id: string;
  course_code: string;
  section_type: "theory_unit" | "practical_unit";
  unit_number: string;
  unit_title: string;
  topics: string;
  marks: number | null;
  contact_hours: number | null;
}

const emptyUnitForm = {
  unit_number: "",
  unit_title: "",
  topics: "",
  marks: "",
  contact_hours: "",
};

const emptyCourseForm = {
  semester: "",
  course_code: "",
  course_name: "",
  course_type: "",
  theory_credits: "",
  practical_credits: "",
  total_credits: "",
  contact_hours: "",
  max_marks: "100",
};

const semesterColors: Record<string, string> = {
  "1": "bg-blue-100 text-blue-800",
  "2": "bg-green-100 text-green-800",
  "3": "bg-purple-100 text-purple-800",
  "4": "bg-orange-100 text-orange-800",
  "5": "bg-red-100 text-red-800",
  "6": "bg-teal-100 text-teal-800",
};

export function SyllabusManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminToken = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" };

  const [activeSemester, setActiveSemester] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState<SyllabusCourse | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  // Course modal state
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<SyllabusCourse | null>(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);

  // Unit modal state
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<CourseContent | null>(null);
  const [unitSectionType, setUnitSectionType] = useState<"theory_unit" | "practical_unit">("theory_unit");
  const [unitForm, setUnitForm] = useState(emptyUnitForm);

  // Fetch courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery<{ courses: SyllabusCourse[] }>({
    queryKey: ["/api/admin/syllabus/courses", activeSemester],
    queryFn: async () => {
      const url = activeSemester === "all"
        ? "/api/admin/syllabus/courses"
        : `/api/admin/syllabus/courses?semester=${activeSemester}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });

  // Fetch course detail
  const { data: courseDetail, isLoading: detailLoading } = useQuery<{ course: SyllabusCourse; content: CourseContent[] }>({
    queryKey: ["/api/admin/syllabus/course-detail", selectedCourse?.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/syllabus/courses/${selectedCourse!.id}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch course detail");
      return res.json();
    },
    enabled: !!selectedCourse,
  });

  // Course mutations
  const createCourse = useMutation({
    mutationFn: async (data: typeof emptyCourseForm) => {
      const res = await fetch("/api/admin/syllabus/courses", { method: "POST", headers, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/syllabus/courses"] });
      setCourseModalOpen(false);
      toast({ title: "Course created successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof emptyCourseForm }) => {
      const res = await fetch(`/api/admin/syllabus/courses/${id}`, { method: "PUT", headers, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/syllabus/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/syllabus/course-detail"] });
      setCourseModalOpen(false);
      toast({ title: "Course updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/syllabus/courses/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/syllabus/courses"] });
      if (selectedCourse) setSelectedCourse(null);
      toast({ title: "Course deleted successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Unit mutations
  const createUnit = useMutation({
    mutationFn: async (data: typeof unitForm & { course_code: string; section_type: string }) => {
      const res = await fetch("/api/admin/syllabus/content", { method: "POST", headers, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/syllabus/course-detail"] });
      setUnitModalOpen(false);
      toast({ title: "Unit added successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateUnit = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof unitForm }) => {
      const res = await fetch(`/api/admin/syllabus/content/${id}`, { method: "PUT", headers, body: JSON.stringify(data) });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/syllabus/course-detail"] });
      setUnitModalOpen(false);
      toast({ title: "Unit updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/syllabus/content/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/syllabus/course-detail"] });
      toast({ title: "Unit deleted successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Handlers
  const openCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm(emptyCourseForm);
    setCourseModalOpen(true);
  };

  const openEditCourse = (course: SyllabusCourse) => {
    setEditingCourse(course);
    setCourseForm({
      semester: course.semester,
      course_code: course.course_code,
      course_name: course.course_name,
      course_type: course.course_type,
      theory_credits: String(course.theory_credits),
      practical_credits: String(course.practical_credits),
      total_credits: String(course.total_credits),
      contact_hours: String(course.contact_hours),
      max_marks: String(course.max_marks),
    });
    setCourseModalOpen(true);
  };

  const submitCourse = () => {
    if (editingCourse) {
      updateCourse.mutate({ id: editingCourse.id, data: courseForm });
    } else {
      createCourse.mutate(courseForm);
    }
  };

  const openAddUnit = (type: "theory_unit" | "practical_unit") => {
    setEditingUnit(null);
    setUnitSectionType(type);
    setUnitForm(emptyUnitForm);
    setUnitModalOpen(true);
  };

  const openEditUnit = (unit: CourseContent) => {
    setEditingUnit(unit);
    setUnitSectionType(unit.section_type);
    setUnitForm({
      unit_number: unit.unit_number,
      unit_title: unit.unit_title,
      topics: unit.topics,
      marks: unit.marks != null ? String(unit.marks) : "",
      contact_hours: unit.contact_hours != null ? String(unit.contact_hours) : "",
    });
    setUnitModalOpen(true);
  };

  const submitUnit = () => {
    if (!selectedCourse) return;
    if (editingUnit) {
      updateUnit.mutate({ id: editingUnit.id, data: unitForm });
    } else {
      createUnit.mutate({ ...unitForm, course_code: selectedCourse.course_code, section_type: unitSectionType });
    }
  };

  const toggleUnit = (id: string) => {
    setExpandedUnits(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const courses = coursesData?.courses || [];
  const theoryUnits = courseDetail?.content.filter(c => c.section_type === "theory_unit") || [];
  const practicalUnits = courseDetail?.content.filter(c => c.section_type === "practical_unit") || [];
  const isPending = createCourse.isPending || updateCourse.isPending || createUnit.isPending || updateUnit.isPending;

  // ===== COURSE DETAIL VIEW =====
  if (selectedCourse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="outline" onClick={() => setSelectedCourse(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedCourse.course_name}</h1>
            <p className="text-sm text-gray-500">{selectedCourse.course_code} — Semester {selectedCourse.semester}</p>
          </div>
        </div>

        {/* Course Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Course Information
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => openEditCourse(selectedCourse)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-medium">Semester</p>
                <p className="text-xl font-bold text-blue-900">{selectedCourse.semester}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-600 font-medium">Total Credits</p>
                <p className="text-xl font-bold text-green-900">{selectedCourse.total_credits}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-purple-600 font-medium">Contact Hours</p>
                <p className="text-xl font-bold text-purple-900">{selectedCourse.contact_hours}/week</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <p className="text-xs text-orange-600 font-medium">Max Marks</p>
                <p className="text-xl font-bold text-orange-900">{selectedCourse.max_marks}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div><span className="font-medium text-gray-600">Course Type:</span> <span className="text-gray-900">{selectedCourse.course_type}</span></div>
              <div><span className="font-medium text-gray-600">Theory Credits:</span> <span className="text-gray-900">{selectedCourse.theory_credits}</span></div>
              <div><span className="font-medium text-gray-600">Practical Credits:</span> <span className="text-gray-900">{selectedCourse.practical_credits}</span></div>
            </div>
          </CardContent>
        </Card>

        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Theory Units */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-blue-600" />
                  Theory Units ({theoryUnits.length})
                </CardTitle>
                <Button size="sm" onClick={() => openAddUnit("theory_unit")}>
                  <Plus className="h-4 w-4 mr-1" /> Add Theory Unit
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {theoryUnits.length === 0 && (
                  <p className="text-center text-gray-400 py-6">No theory units yet</p>
                )}
                {theoryUnits.map((unit) => (
                  <div key={unit.id} className="border border-blue-100 rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-blue-50 cursor-pointer"
                      onClick={() => toggleUnit(unit.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-mono">
                          Unit {unit.unit_number}
                        </Badge>
                        <span className="font-medium text-gray-900">{unit.unit_title}</span>
                        {unit.contact_hours && (
                          <span className="text-xs text-gray-500 hidden sm:inline">({unit.contact_hours} hrs)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); openEditUnit(unit); }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={(e) => { e.stopPropagation(); deleteUnit.mutate(unit.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {expandedUnits.has(unit.id) ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                      </div>
                    </div>
                    {expandedUnits.has(unit.id) && (
                      <div className="p-4 bg-white">
                        <p className="text-sm font-medium text-gray-600 mb-2">Topics:</p>
                        <ul className="space-y-1">
                          {unit.topics.split(";").map((topic, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{topic.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Practical Units */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-green-600" />
                  Practical Units ({practicalUnits.length})
                </CardTitle>
                <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => openAddUnit("practical_unit")}>
                  <Plus className="h-4 w-4 mr-1" /> Add Practical Unit
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {practicalUnits.length === 0 && (
                  <p className="text-center text-gray-400 py-6">No practical units yet</p>
                )}
                {practicalUnits.map((unit) => (
                  <div key={unit.id} className="border border-green-100 rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-green-50 cursor-pointer"
                      onClick={() => toggleUnit(unit.id)}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 font-mono">
                          Unit {unit.unit_number}
                        </Badge>
                        <span className="font-medium text-gray-900">{unit.unit_title}</span>
                        {unit.marks != null && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs">{unit.marks} marks</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); openEditUnit(unit); }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={(e) => { e.stopPropagation(); deleteUnit.mutate(unit.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {expandedUnits.has(unit.id) ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                      </div>
                    </div>
                    {expandedUnits.has(unit.id) && (
                      <div className="p-4 bg-white">
                        <p className="text-sm text-gray-700">{unit.topics}</p>
                        {unit.contact_hours && (
                          <p className="text-xs text-gray-500 mt-2">Contact Hours: {unit.contact_hours}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {/* Unit Modal */}
        <UnitModal
          open={unitModalOpen}
          onClose={() => setUnitModalOpen(false)}
          sectionType={unitSectionType}
          form={unitForm}
          setForm={setUnitForm}
          onSubmit={submitUnit}
          isPending={isPending}
          isEditing={!!editingUnit}
        />

        {/* Course Edit Modal (reuse) */}
        <CourseModal
          open={courseModalOpen}
          onClose={() => setCourseModalOpen(false)}
          form={courseForm}
          setForm={setCourseForm}
          onSubmit={submitCourse}
          isPending={isPending}
          isEditing={!!editingCourse}
        />
      </div>
    );
  }

  // ===== COURSE LIST VIEW =====
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Syllabus Manager</h1>
          <p className="text-sm text-gray-600 mt-1">BSC Physical Education — Kurukshetra University (NEP 2020)</p>
        </div>
        <Button onClick={openCreateCourse}>
          <Plus className="mr-2 h-4 w-4" /> Add New Course
        </Button>
      </div>

      {/* Semester Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "1", "2", "3", "4", "5", "6"].map((sem) => (
          <Button
            key={sem}
            variant={activeSemester === sem ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSemester(sem)}
          >
            {sem === "all" ? "All Semesters" : `Semester ${sem}`}
          </Button>
        ))}
      </div>

      {coursesLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No courses found</p>
            <p className="text-sm text-gray-400 mt-1">Run syllabus-setup.sql in Supabase to load all courses</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sem</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Course Name</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Credits</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Marks</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedCourse(course)}
                    >
                      <td className="p-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${semesterColors[course.semester] || "bg-gray-100 text-gray-800"}`}>
                          {course.semester}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm font-semibold text-gray-700">{course.course_code}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{course.course_name}</span>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-sm text-gray-500">{course.course_type}</span>
                      </td>
                      <td className="p-4 text-center hidden sm:table-cell">
                        <span className="text-sm font-semibold text-gray-700">{course.total_credits}</span>
                        <span className="text-xs text-gray-400 ml-1">({course.theory_credits}T+{course.practical_credits}P)</span>
                      </td>
                      <td className="p-4 text-center hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs">{course.max_marks}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => openEditCourse(course)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Delete "${course.course_name}" and all its content?`)) {
                                deleteCourse.mutate(course.id);
                              }
                            }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t bg-gray-50 text-sm text-gray-500">
              Total: {courses.length} courses
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Modal */}
      <CourseModal
        open={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        form={courseForm}
        setForm={setCourseForm}
        onSubmit={submitCourse}
        isPending={isPending}
        isEditing={!!editingCourse}
      />
    </div>
  );
}

// ===== Course Form Modal =====
function CourseModal({ open, onClose, form, setForm, onSubmit, isPending, isEditing }: {
  open: boolean;
  onClose: () => void;
  form: typeof emptyCourseForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyCourseForm>>;
  onSubmit: () => void;
  isPending: boolean;
  isEditing: boolean;
}) {
  const set = (field: keyof typeof emptyCourseForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Course" : "Add New Course"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Semester *</Label>
              <Select value={form.semester} onValueChange={v => setForm(prev => ({ ...prev, semester: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["1","2","3","4","5","6"].map(s => <SelectItem key={s} value={s}>Semester {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Course Code *</Label>
              <Input value={form.course_code} onChange={set("course_code")} placeholder="23-BPE-101" />
            </div>
          </div>
          <div>
            <Label>Course Name *</Label>
            <Input value={form.course_name} onChange={set("course_name")} placeholder="History and Foundation of Physical Education" />
          </div>
          <div>
            <Label>Course Type *</Label>
            <Input value={form.course_type} onChange={set("course_type")} placeholder="Core Course - 1" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Theory Credits</Label>
              <Input type="number" value={form.theory_credits} onChange={set("theory_credits")} placeholder="3" />
            </div>
            <div>
              <Label>Practical Credits</Label>
              <Input type="number" value={form.practical_credits} onChange={set("practical_credits")} placeholder="1" />
            </div>
            <div>
              <Label>Total Credits</Label>
              <Input type="number" value={form.total_credits} onChange={set("total_credits")} placeholder="4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contact Hours/Week</Label>
              <Input type="number" value={form.contact_hours} onChange={set("contact_hours")} placeholder="5" />
            </div>
            <div>
              <Label>Max Marks</Label>
              <Input type="number" value={form.max_marks} onChange={set("max_marks")} placeholder="100" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={onSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== Unit Form Modal =====
function UnitModal({ open, onClose, sectionType, form, setForm, onSubmit, isPending, isEditing }: {
  open: boolean;
  onClose: () => void;
  sectionType: "theory_unit" | "practical_unit";
  form: typeof emptyUnitForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyUnitForm>>;
  onSubmit: () => void;
  isPending: boolean;
  isEditing: boolean;
}) {
  const set = (field: keyof typeof emptyUnitForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const isTheory = sectionType === "theory_unit";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isTheory ? <BookMarked className="h-5 w-5 text-blue-600" /> : <FlaskConical className="h-5 w-5 text-green-600" />}
            {isEditing ? "Edit" : "Add"} {isTheory ? "Theory" : "Practical"} Unit
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Unit Number *</Label>
              <Input value={form.unit_number} onChange={set("unit_number")} placeholder="I, II, III..." />
            </div>
            <div>
              <Label>Contact Hours</Label>
              <Input type="number" value={form.contact_hours} onChange={set("contact_hours")} placeholder="10" />
            </div>
          </div>
          <div>
            <Label>Unit Title *</Label>
            <Input value={form.unit_title} onChange={set("unit_title")} placeholder="Introduction to..." />
          </div>
          <div>
            <Label>Topics * {isTheory ? "(separate with semicolons ;)" : ""}</Label>
            <Textarea
              value={form.topics}
              onChange={set("topics")}
              rows={5}
              placeholder={isTheory
                ? "Topic 1; Topic 2; Topic 3..."
                : "Description of the practical activity"
              }
            />
          </div>
          {!isTheory && (
            <div>
              <Label>Marks</Label>
              <Input type="number" value={form.marks} onChange={set("marks")} placeholder="15" />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={onSubmit}
              disabled={isPending}
              className={isTheory ? "" : "bg-green-600 hover:bg-green-700"}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update" : "Add"} Unit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
