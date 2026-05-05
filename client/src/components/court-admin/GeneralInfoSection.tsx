import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Save, Calendar, Edit, Plus, Trash2, ChevronDown, Sparkles, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedAIInput } from "../admin/EnhancedAIInput";
import { EnhancedAIPreview } from "../admin/EnhancedAIPreview";
import { format, startOfYear, endOfYear, eachWeekOfInterval, getDay, addDays, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";

interface Holiday {
  id: string;
  date: string;
  name: string;
  type: "gazetted" | "restricted" | "weekly_off" | "vacation";
}

interface AdditionalInfoEntry {
  id: string;
  title: string;
  content: string;
  category?: string;
}

interface DynamicField {
  id: string;
  label: string;
  value: string;
}

export function GeneralInfoSection() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: generalInfo } = useQuery({
    queryKey: ["/api/court-admin/general-info"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/general-info");
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  const [formData, setFormData] = useState({
    court_name: "District and Sessions Court, Kaithal",
    address: "District Courts Complex, Karnal Road, Kaithal, Haryana, India",
    pin_code: "136027",
    landmark: "",
    contact_reception: "01746-235749",
    contact_pro: "9817709002",
    contact_legal_aid: "01746-235759",
    email: "dsjktl@hry.nic.in",
    website: "https://kaithal.dcourts.gov.in/",
    working_hours: "10:00 AM to 4:00 PM (Monday to Friday)",
    lunch_break: "1:00 PM to 1:45 PM (Typically)",
  });

  // Dynamic fields state
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [fieldMode, setFieldMode] = useState<'manual' | 'ai'>('manual');
  const [fieldAiPrompt, setFieldAiPrompt] = useState("");
  const [isGeneratingField, setIsGeneratingField] = useState(false);
  const [fieldAiData, setFieldAiData] = useState<any>(null);

  useEffect(() => {
    if (generalInfo?.data) {
      setFormData({
        court_name: generalInfo.data.court_name || "District and Sessions Court, Kaithal",
        address: generalInfo.data.address || "District Courts Complex, Karnal Road, Kaithal, Haryana, India",
        pin_code: generalInfo.data.pin_code || "136027",
        landmark: generalInfo.data.landmark || "",
        contact_reception: generalInfo.data.contact_reception || "01746-235749",
        contact_pro: generalInfo.data.contact_pro || "9817709002",
        contact_legal_aid: generalInfo.data.contact_legal_aid || "01746-235759",
        email: generalInfo.data.email || "dsjktl@hry.nic.in",
        website: generalInfo.data.website || "https://kaithal.dcourts.gov.in/",
        working_hours: generalInfo.data.working_hours || "10:00 AM to 4:00 PM (Monday to Friday)",
        lunch_break: generalInfo.data.lunch_break || "1:00 PM to 1:45 PM (Typically)",
      });
      if (generalInfo.data.dynamic_fields) {
        setDynamicFields(generalInfo.data.dynamic_fields);
      }
    }
  }, [generalInfo]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/court-admin/general-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, dynamic_fields: dynamicFields }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/general-info"] });
      toast({ title: "Success", description: "General info updated successfully" });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Holidays state and handlers
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isEditingHolidays, setIsEditingHolidays] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    date: new Date(),
    name: "",
    type: "gazetted" as Holiday["type"],
  });
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [holidayMode, setHolidayMode] = useState<'manual' | 'ai'>('manual');
  const [holidayAiPrompt, setHolidayAiPrompt] = useState("");
  const [isGeneratingHoliday, setIsGeneratingHoliday] = useState(false);

  // Additional Info state and handlers
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfoEntry[]>([]);
  const [isEditingAdditionalInfo, setIsEditingAdditionalInfo] = useState(false);
  const [isAddInfoDialogOpen, setIsAddInfoDialogOpen] = useState(false);
  const [addInfoMode, setAddInfoMode] = useState<'manual' | 'ai'>('manual');
  const [newInfoEntry, setNewInfoEntry] = useState({ title: "", content: "", category: "" });
  const [editingInfoId, setEditingInfoId] = useState<string | null>(null);
  const [editedInfoEntry, setEditedInfoEntry] = useState<AdditionalInfoEntry | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState<any>(null);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [browserSupported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  // Fetch holidays
  const { data: holidaysData } = useQuery({
    queryKey: ["/api/court-admin/holidays"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/holidays");
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  // Fetch additional info
  const { data: additionalInfoData } = useQuery({
    queryKey: ["/api/court-admin/additional-info"],
    queryFn: async () => {
      const res = await fetch("/api/court-admin/additional-info");
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (holidaysData?.holidays) {
      setHolidays(holidaysData.holidays);
    }
  }, [holidaysData]);

  useEffect(() => {
    if (additionalInfoData?.entries) {
      setAdditionalInfo(additionalInfoData.entries);
    }
  }, [additionalInfoData]);

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  // Dynamic field handlers
  const handleOpenFieldDialog = (mode: 'manual' | 'ai') => {
    setFieldMode(mode);
    setFieldDialogOpen(true);
    setFieldAiData(null);
    setFieldAiPrompt("");
  };

  const handleAddDynamicField = () => {
    if (!newFieldLabel.trim() || !newFieldValue.trim()) {
      toast({ title: "Error", description: "Both label and value are required", variant: "destructive" });
      return;
    }
    const newField: DynamicField = {
      id: Date.now().toString(),
      label: newFieldLabel,
      value: newFieldValue,
    };
    setDynamicFields([...dynamicFields, newField]);
    setNewFieldLabel("");
    setNewFieldValue("");
    setFieldDialogOpen(false);
    toast({ title: "Success", description: "Field added" });
  };

  const handleGenerateField = async () => {
    if (!fieldAiPrompt.trim()) {
      toast({ title: "Error", description: "Please enter a description", variant: "destructive" });
      return;
    }

    setIsGeneratingField(true);
    try {
      const response = await fetch("/api/court-admin/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: fieldAiPrompt,
          type: "court_field",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate");
      }
      
      const result = await response.json();
      setFieldAiData(result);
      toast({ title: "Success", description: "Field generated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingField(false);
    }
  };

  const handleConfirmFieldAI = () => {
    if (!fieldAiData) return;
    const fields = fieldAiData.fields || [fieldAiData];
    const newFields = fields.map((f: any) => ({
      id: Date.now().toString() + Math.random(),
      label: f.label || f.field_name,
      value: f.value || f.field_value || "",
    }));
    setDynamicFields([...dynamicFields, ...newFields]);
    setFieldAiData(null);
    setFieldAiPrompt("");
    setFieldDialogOpen(false);
    toast({ title: "Success", description: `${newFields.length} field(s) added` });
  };

  const handleDeleteDynamicField = (id: string) => {
    setDynamicFields(dynamicFields.filter((f) => f.id !== id));
    toast({ title: "Success", description: "Field removed" });
  };

  const handleUpdateDynamicField = (id: string, label: string, value: string) => {
    setDynamicFields(dynamicFields.map((f) => 
      f.id === id ? { ...f, label, value } : f
    ));
  };

  const saveHolidaysMutation = useMutation({
    mutationFn: async (data: Holiday[]) => {
      const res = await fetch("/api/court-admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holidays: data }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/holidays"] });
      toast({ title: "Success", description: "Holidays updated successfully" });
      setIsEditingHolidays(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const saveAdditionalInfoMutation = useMutation({
    mutationFn: async (data: AdditionalInfoEntry[]) => {
      const res = await fetch("/api/court-admin/additional-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: data }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/court-admin/additional-info"] });
      toast({ title: "Success", description: "Additional info updated successfully" });
      setIsEditingAdditionalInfo(false);
      setEditingInfoId(null);
      setEditedInfoEntry(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAddHoliday = () => {
    if (!newHoliday.name.trim()) {
      toast({ title: "Error", description: "Holiday name is required", variant: "destructive" });
      return;
    }
    const holiday: Holiday = {
      id: Date.now().toString(),
      date: format(newHoliday.date, "yyyy-MM-dd"),
      name: newHoliday.name,
      type: newHoliday.type,
    };
    setHolidays([...holidays, holiday]);
    setNewHoliday({ date: new Date(), name: "", type: "gazetted" });
    setIsHolidayDialogOpen(false);
    toast({ title: "Success", description: "Holiday added" });
  };

  // Smart AI Holiday generation
  const handleGenerateHolidayAI = async () => {
    if (!holidayAiPrompt.trim()) {
      toast({ title: "Error", description: "Please describe the holidays", variant: "destructive" });
      return;
    }

    setIsGeneratingHoliday(true);
    try {
      // Parse natural language for smart holiday generation
      const prompt = holidayAiPrompt.toLowerCase();
      const newHolidays: Holiday[] = [];
      const currentYear = new Date().getFullYear();
      const yearStart = startOfYear(new Date(currentYear, 0, 1));
      const yearEnd = endOfYear(new Date(currentYear, 11, 31));

      // Check for weekly patterns
      if (prompt.includes('sunday') && (prompt.includes('weekly') || prompt.includes('every'))) {
        const sundays = eachWeekOfInterval({ start: yearStart, end: yearEnd }).map(week => {
          const sunday = addDays(week, 0 - getDay(week));
          return sunday;
        });
        sundays.forEach((date, index) => {
          newHolidays.push({
            id: `sunday-${index}-${Date.now()}`,
            date: format(date, "yyyy-MM-dd"),
            name: "Sunday (Weekly Off)",
            type: "weekly_off",
          });
        });
      }

      // Check for 2nd Saturday pattern (but not if user wants to exclude it)
      if ((prompt.includes('2nd saturday') || prompt.includes('second saturday')) && 
          !prompt.includes('except')) {
        const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
        
        months.forEach((month, monthIndex) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          
          // Get all Saturdays in this month
          const saturdays = eachWeekOfInterval({ start: monthStart, end: monthEnd })
            .map(week => addDays(week, 6 - getDay(week)))
            .filter(sat => sat >= monthStart && sat <= monthEnd);
          
          // Get the 2nd Saturday (index 1)
          if (saturdays.length >= 2) {
            const secondSaturday = saturdays[1];
            newHolidays.push({
              id: `2nd-sat-${monthIndex}-${Date.now()}`,
              date: format(secondSaturday, "yyyy-MM-dd"),
              name: "2nd Saturday (Weekly Off)",
              type: "weekly_off",
            });
          }
        });
      }

      // Check for all Saturdays except 2nd
      if ((prompt.includes('saturday') && prompt.includes('except 2nd')) || 
          (prompt.includes('1st') && prompt.includes('saturday'))) {
        const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
        
        months.forEach((month) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          
          // Get all Saturdays in this month
          const saturdays = eachWeekOfInterval({ start: monthStart, end: monthEnd })
            .map(week => addDays(week, 6 - getDay(week)))
            .filter(sat => sat >= monthStart && sat <= monthEnd);
          
          // Add all Saturdays except the 2nd one (index 1)
          saturdays.forEach((saturday, index) => {
            if (index !== 1) { // Skip 2nd Saturday
              newHolidays.push({
                id: `sat-${index}-${month.getMonth()}-${Date.now()}`,
                date: format(saturday, "yyyy-MM-dd"),
                name: "Saturday (Weekly Off)",
                type: "weekly_off",
              });
            }
          });
        });
      }

      // If no pattern detected, use AI API
      if (newHolidays.length === 0) {
        const response = await fetch("/api/court-admin/ai-generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: holidayAiPrompt,
            type: "court_holidays",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to generate");
        }
        
        const result = await response.json();
        const aiHolidays = result.holidays || [result];
        aiHolidays.forEach((h: any, index: number) => {
          newHolidays.push({
            id: `ai-${index}-${Date.now()}`,
            date: h.date || format(new Date(), "yyyy-MM-dd"),
            name: h.name || h.holiday_name || "Holiday",
            type: h.type || "gazetted",
          });
        });
      }

      setHolidays([...holidays, ...newHolidays]);
      setHolidayAiPrompt("");
      setIsHolidayDialogOpen(false);
      toast({ 
        title: "Success", 
        description: `${newHolidays.length} holiday(s) added successfully` 
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingHoliday(false);
    }
  };

  const handleDeleteHoliday = (id: string) => {
    setHolidays(holidays.filter((h) => h.id !== id));
    toast({ title: "Success", description: "Holiday removed" });
  };

  const handleSaveHolidays = () => {
    saveHolidaysMutation.mutate(holidays);
  };

  // Additional Info handlers
  const handleOpenAddInfoDialog = (mode: 'manual' | 'ai') => {
    setAddInfoMode(mode);
    setIsAddInfoDialogOpen(true);
    setAiGeneratedData(null);
    setAiPrompt("");
  };

  const handleAddInfoEntry = () => {
    if (!newInfoEntry.title || !newInfoEntry.content) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }
    const entry: AdditionalInfoEntry = {
      id: Date.now().toString(),
      ...newInfoEntry,
    };
    setAdditionalInfo([...additionalInfo, entry]);
    setNewInfoEntry({ title: "", content: "", category: "" });
    setIsAddInfoDialogOpen(false);
    toast({ title: "Success", description: "Entry added" });
  };

  const handleEditInfoEntry = (entry: AdditionalInfoEntry) => {
    setEditingInfoId(entry.id);
    setEditedInfoEntry({ ...entry });
  };

  const handleSaveEditedInfo = () => {
    if (!editedInfoEntry) return;
    setAdditionalInfo(additionalInfo.map(e => 
      e.id === editingInfoId ? editedInfoEntry : e
    ));
    setEditingInfoId(null);
    setEditedInfoEntry(null);
    toast({ title: "Success", description: "Entry updated" });
  };

  const handleCancelEditInfo = () => {
    setEditingInfoId(null);
    setEditedInfoEntry(null);
  };

  const handleDeleteInfoEntry = (id: string) => {
    setAdditionalInfo(additionalInfo.filter((e) => e.id !== id));
    toast({ title: "Success", description: "Entry removed" });
  };

  const handleSaveAdditionalInfo = () => {
    saveAdditionalInfoMutation.mutate(additionalInfo);
  };

  // AI Generation handlers
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: "Error", description: "Please enter a description", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/court-admin/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          type: "court_additional_info",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate");
      }
      
      const result = await response.json();
      setAiGeneratedData(result);
      setCurrentPreviewIndex(0);
      toast({ title: "Success", description: "Information generated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmAI = () => {
    if (!aiGeneratedData) return;
    const newEntries = aiGeneratedData.entries || [aiGeneratedData];
    const entriesWithIds = newEntries.map((entry: any) => ({
      id: Date.now().toString() + Math.random(),
      title: entry.title,
      content: entry.content,
      category: entry.category || "",
    }));
    setAdditionalInfo([...additionalInfo, ...entriesWithIds]);
    setAiGeneratedData(null);
    setAiPrompt("");
    setIsAddInfoDialogOpen(false);
    toast({ 
      title: "Success", 
      description: `${entriesWithIds.length} entry/entries added successfully` 
    });
  };

  const handleRegenerateAI = () => {
    setAiGeneratedData(null);
    setCurrentPreviewIndex(0);
  };

  const handleEditAIEntry = (entry: any, index: number) => {
    const updatedEntries = [...(aiGeneratedData.entries || [aiGeneratedData])];
    updatedEntries[index] = entry;
    setAiGeneratedData({ ...aiGeneratedData, entries: updatedEntries });
  };

  const handleDeleteAIEntry = (index: number) => {
    const updatedEntries = [...(aiGeneratedData.entries || [aiGeneratedData])];
    updatedEntries.splice(index, 1);
    if (updatedEntries.length === 0) {
      setAiGeneratedData(null);
    } else {
      setAiGeneratedData({ ...aiGeneratedData, entries: updatedEntries });
    }
  };

  const handleToggleVoice = () => {
    if (!browserSupported) {
      toast({ title: "Not Supported", description: "Voice input not supported in this browser", variant: "destructive" });
      return;
    }
    setIsListening(!isListening);
  };

  // Get holiday color based on type
  const getHolidayColor = (type: Holiday["type"]) => {
    switch (type) {
      case "gazetted":
        return "bg-red-500";
      case "restricted":
        return "bg-orange-500";
      case "weekly_off":
        return "bg-blue-500";
      case "vacation":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getHolidayTypeLabel = (type: Holiday["type"]) => {
    switch (type) {
      case "gazetted":
        return "Gazetted Holiday";
      case "restricted":
        return "Restricted Holiday";
      case "weekly_off":
        return "Weekly Off";
      case "vacation":
        return "Vacation";
      default:
        return type;
    }
  };

  // Get holidays for calendar display
  const holidayDates = holidays.map(h => new Date(h.date));
  const modifiers = {
    gazetted: holidays.filter(h => h.type === "gazetted").map(h => new Date(h.date)),
    restricted: holidays.filter(h => h.type === "restricted").map(h => new Date(h.date)),
    weeklyOff: holidays.filter(h => h.type === "weekly_off").map(h => new Date(h.date)),
    vacation: holidays.filter(h => h.type === "vacation").map(h => new Date(h.date)),
  };

  const modifiersStyles = {
    gazetted: { backgroundColor: "#ef4444", color: "white", borderRadius: "50%" },
    restricted: { backgroundColor: "#f97316", color: "white", borderRadius: "50%" },
    weeklyOff: { backgroundColor: "#3b82f6", color: "white", borderRadius: "50%" },
    vacation: { backgroundColor: "#22c55e", color: "white", borderRadius: "50%" },
  };

  return (
    <div className="space-y-6">
      {/* Basic Court Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Basic Court Information</CardTitle>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Court Name</Label>
              {isEditing ? (
                <Input
                  value={formData.court_name}
                  onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                  placeholder="Enter court name"
                />
              ) : (
                <p className="mt-2 text-gray-700">{formData.court_name || "N/A"}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label>Address</Label>
              {isEditing ? (
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                  rows={2}
                />
              ) : (
                <p className="mt-2 text-gray-700">{formData.address || "N/A"}</p>
              )}
            </div>

            <div>
              <Label>Pin Code</Label>
              {isEditing ? (
                <Input
                  value={formData.pin_code}
                  onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                  placeholder="Enter pin code"
                />
              ) : (
                <p className="mt-2 text-gray-700">{formData.pin_code || "N/A"}</p>
              )}
            </div>

            <div>
              <Label>Landmark</Label>
              {isEditing ? (
                <Input
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  placeholder="Enter landmark"
                />
              ) : (
                <p className="mt-2 text-gray-700">{formData.landmark || "N/A"}</p>
              )}
            </div>

            <div>
              <Label>Contact Number (Reception)</Label>
              {isEditing ? (
                <Input
                  value={formData.contact_reception}
                  onChange={(e) => setFormData({ ...formData, contact_reception: e.target.value })}
                  placeholder="Enter reception contact"
                />
              ) : (
                <p className="mt-2 text-gray-700">{formData.contact_reception || "N/A"}</p>
              )}
            </div>

            <div>
              <Label>Contact Number (PRO)</Label>
              {isEditing ? (
                <Input
                  value={formData.contact_pro}
                  onChange={(e) => setFormData({ ...formData, contact_pro: e.target.value })}
                  placeholder="Enter PRO contact"
                />
              ) : (
                <p className="mt-2 text-gray-700">{formData.contact_pro || "N/A"}</p>
              )}
            </div>

            <div>
              <Label>Contact Number (Legal Aid)</Label>
              {isEditing ? (
                <Input
                  value={formData.contact_legal_aid}
                  onChange={(e) => setFormData({ ...formData, contact_legal_aid: e.target.value })}
                  placeholder="Enter legal aid contact"
                />
              ) : (
                <p className="mt-2 text-gray-700">{formData.contact_legal_aid || "N/A"}</p>
              )}
            </div>

            <div>
              <Label>Official Email</Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
              ) : (
                <p className="mt-2 text-gray-700">{formData.email || "N/A"}</p>
              )}
            </div>

            <div>
              <Label>Official Website</Label>
              {isEditing ? (
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="Enter website URL"
                />
              ) : (
                <p className="mt-2 text-gray-700">{formData.website || "N/A"}</p>
              )}
            </div>

            <div>
              <Label>Working Hours</Label>
              {isEditing ? (
                <Input
                  value={formData.working_hours}
                  onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                  placeholder="e.g., 10:00 AM - 5:00 PM"
                />
              ) : (
                <p className="mt-2 text-gray-700">{formData.working_hours || "N/A"}</p>
              )}
            </div>

            <div>
              <Label>Lunch Break</Label>
              {isEditing ? (
                <Input
                  value={formData.lunch_break}
                  onChange={(e) => setFormData({ ...formData, lunch_break: e.target.value })}
                  placeholder="e.g., 1:00 PM - 2:00 PM"
                />
              ) : (
                <p className="mt-2 text-gray-700">{formData.lunch_break || "N/A"}</p>
              )}
            </div>

            {/* Dynamic Fields */}
            {dynamicFields.map((field) => (
              <div key={field.id} className="md:col-span-2">
                <Label>{field.label}</Label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      value={field.label}
                      onChange={(e) => handleUpdateDynamicField(field.id, e.target.value, field.value)}
                      placeholder="Field label"
                      className="flex-1"
                    />
                    <Input
                      value={field.value}
                      onChange={(e) => handleUpdateDynamicField(field.id, field.label, e.target.value)}
                      placeholder="Field value"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDynamicField(field.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <p className="mt-2 text-gray-700">{field.value || "N/A"}</p>
                )}
              </div>
            ))}
          </div>

          {/* Add Field Button */}
          {isEditing && (
            <div className="pt-4 border-t">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleOpenFieldDialog('manual')}>
                    Manual Entry
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenFieldDialog('ai')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Powered
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add Field Dialog */}
              <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {fieldMode === 'ai' ? 'AI-Powered Add Field' : 'Manual Add Field'}
                    </DialogTitle>
                  </DialogHeader>

                  {fieldMode === 'ai' ? (
                    <div className="space-y-4">
                      {!fieldAiData ? (
                        <>
                          <Textarea
                            value={fieldAiPrompt}
                            onChange={(e) => setFieldAiPrompt(e.target.value)}
                            placeholder="Describe the field(s) you want to add... e.g., 'Add fax number field'"
                            rows={4}
                          />
                          <Button 
                            onClick={handleGenerateField} 
                            disabled={isGeneratingField}
                            className="w-full"
                          >
                            {isGeneratingField ? "Generating..." : "Generate with AI"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                            <p className="font-semibold">Generated Field:</p>
                            <p><strong>Label:</strong> {fieldAiData.label || fieldAiData.field_name}</p>
                            <p><strong>Value:</strong> {fieldAiData.value || fieldAiData.field_value}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => setFieldAiData(null)} variant="outline" className="flex-1">
                              Regenerate
                            </Button>
                            <Button onClick={handleConfirmFieldAI} className="flex-1">
                              Add Field
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Field Label</Label>
                        <Input
                          value={newFieldLabel}
                          onChange={(e) => setNewFieldLabel(e.target.value)}
                          placeholder="e.g., Fax Number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Field Value</Label>
                        <Input
                          value={newFieldValue}
                          onChange={(e) => setNewFieldValue(e.target.value)}
                          placeholder="Enter value"
                        />
                      </div>
                      <Button onClick={handleAddDynamicField} className="w-full">
                        Add Field
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Holidays Calendar */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Holidays Calendar
            </CardTitle>
            {!isEditingHolidays ? (
              <Button onClick={() => setIsEditingHolidays(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditingHolidays(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleSaveHolidays} disabled={saveHolidaysMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveHolidaysMutation.isPending ? "Saving..." : "Save Holidays"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calendar Display - Made Wider */}
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <CalendarUI
                mode="single"
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-md border w-full scale-125 origin-top"
              />
            </div>
          </div>

          {/* Holiday Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-700">Gazetted Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-700">Restricted Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-700">Weekly Off</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-700">Vacation</span>
            </div>
          </div>

          {/* Add Holiday Button (Only in Edit Mode) */}
          {isEditingHolidays && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Holiday
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => { setHolidayMode('manual'); setIsHolidayDialogOpen(true); }}>
                  Manual Entry
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setHolidayMode('ai'); setIsHolidayDialogOpen(true); }}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Powered (Smart)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Add Holiday Dialog */}
          <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {holidayMode === 'ai' ? 'AI-Powered Add Holiday' : 'Manual Add Holiday'}
                </DialogTitle>
                {holidayMode === 'ai' && (
                  <DialogDescription>
                    Use natural language like "weekly holiday on Sunday" or "2nd Saturday off"
                  </DialogDescription>
                )}
              </DialogHeader>

              {holidayMode === 'ai' ? (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Describe Holidays</Label>
                    <Textarea
                      value={holidayAiPrompt}
                      onChange={(e) => setHolidayAiPrompt(e.target.value)}
                      placeholder="e.g., 'Weekly holiday on Sunday' or '2nd Saturday off' or 'All Saturdays except 2nd Saturday'"
                      rows={4}
                    />
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-semibold">Smart Examples:</p>
                    <p>• "Weekly holiday on Sunday" - Marks all Sundays</p>
                    <p>• "2nd Saturday off" - Marks all 2nd Saturdays</p>
                    <p>• "All Saturdays except 2nd Saturday" - Marks 1st, 3rd, 4th Saturdays</p>
                  </div>
                  <Button 
                    onClick={handleGenerateHolidayAI} 
                    disabled={isGeneratingHoliday}
                    className="w-full"
                  >
                    {isGeneratingHoliday ? "Generating..." : "Generate Holidays"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Holiday Name</Label>
                    <Input
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                      placeholder="Enter holiday name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <CalendarUI
                      mode="single"
                      selected={newHoliday.date}
                      onSelect={(date) => date && setNewHoliday({ ...newHoliday, date })}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newHoliday.type}
                      onValueChange={(value: Holiday["type"]) => setNewHoliday({ ...newHoliday, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gazetted">Gazetted Holiday</SelectItem>
                        <SelectItem value="restricted">Restricted Holiday</SelectItem>
                        <SelectItem value="weekly_off">Weekly Off</SelectItem>
                        <SelectItem value="vacation">Vacation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddHoliday} className="w-full">
                    Add Holiday
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Holidays List */}
          {holidays.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700">Holidays List:</h4>
              <div className="space-y-2">
                {holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getHolidayColor(holiday.type)}`}></div>
                      <div>
                        <p className="font-medium text-sm">{holiday.name}</p>
                        <p className="text-xs text-gray-600">
                          {format(new Date(holiday.date), "MMMM dd, yyyy")} • {getHolidayTypeLabel(holiday.type)}
                        </p>
                      </div>
                    </div>
                    {isEditingHolidays && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteHoliday(holiday.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Additional Information</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Add custom information manually or with AI assistance</p>
            </div>
            {!isEditingAdditionalInfo ? (
              <Button onClick={() => setIsEditingAdditionalInfo(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditingAdditionalInfo(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleSaveAdditionalInfo} disabled={saveAdditionalInfoMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveAdditionalInfoMutation.isPending ? "Saving..." : "Save All"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Information Button (Only in Edit Mode) */}
          {isEditingAdditionalInfo && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Information
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleOpenAddInfoDialog('manual')}>
                  Manual Entry
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleOpenAddInfoDialog('ai')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Powered
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Add Information Dialog */}
          <Dialog open={isAddInfoDialogOpen} onOpenChange={setIsAddInfoDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {addInfoMode === 'ai' ? 'AI-Powered Add Information' : 'Manual Add Information'}
                </DialogTitle>
                <DialogDescription>
                  {addInfoMode === 'ai' 
                    ? "Describe the information in natural language and AI will structure it for you" 
                    : "Add additional information manually"}
                </DialogDescription>
              </DialogHeader>

              {addInfoMode === 'ai' ? (
                <>
                  {!aiGeneratedData ? (
                    <EnhancedAIInput
                      prompt={aiPrompt}
                      onPromptChange={setAiPrompt}
                      onGenerate={handleGenerateAI}
                      isGenerating={isGenerating}
                      isListening={isListening}
                      onToggleVoice={handleToggleVoice}
                      browserSupported={browserSupported}
                      placeholder="Describe the court information you want to add..."
                      examples={[
                        "Add information about court timings and procedures",
                        "Add details about visiting guidelines and security protocols",
                        "Add information about legal aid services available"
                      ]}
                      sectionType="court information"
                    />
                  ) : (
                    <EnhancedAIPreview
                      entries={aiGeneratedData.entries || [aiGeneratedData]}
                      currentIndex={currentPreviewIndex}
                      onIndexChange={setCurrentPreviewIndex}
                      renderPreview={(entry) => (
                        <div className="space-y-3">
                          <div>
                            <span className="font-semibold text-gray-700 block mb-1">Title:</span>
                            <p className="text-gray-900 text-lg">{entry.title}</p>
                          </div>
                          {entry.category && (
                            <div>
                              <span className="font-semibold text-gray-700 block mb-1">Category:</span>
                              <p className="text-gray-900">{entry.category}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-gray-700 block mb-1">Content:</span>
                            <p className="text-gray-900 whitespace-pre-wrap">{entry.content}</p>
                          </div>
                        </div>
                      )}
                      onConfirmAll={handleConfirmAI}
                      onRegenerate={handleRegenerateAI}
                      onEditEntry={handleEditAIEntry}
                      onDeleteEntry={handleDeleteAIEntry}
                      confirmButtonText={`Add ${(aiGeneratedData.entries || [aiGeneratedData]).length} Entry/Entries`}
                      entryTypeName="Information"
                    />
                  )}
                </>
              ) : (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newInfoEntry.title}
                      onChange={(e) => setNewInfoEntry({ ...newInfoEntry, title: e.target.value })}
                      placeholder="Enter title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category (Optional)</Label>
                    <Input
                      id="category"
                      value={newInfoEntry.category}
                      onChange={(e) => setNewInfoEntry({ ...newInfoEntry, category: e.target.value })}
                      placeholder="e.g., Procedures, Services, Guidelines"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={newInfoEntry.content}
                      onChange={(e) => setNewInfoEntry({ ...newInfoEntry, content: e.target.value })}
                      placeholder="Enter content"
                      rows={6}
                    />
                  </div>
                  <Button onClick={handleAddInfoEntry} className="w-full">
                    Add Entry
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Additional Information List */}
          {additionalInfo.length > 0 ? (
            <div className="space-y-3">
              {additionalInfo.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  {editingInfoId === entry.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Title</Label>
                        <Input
                          value={editedInfoEntry?.title || ""}
                          onChange={(e) => setEditedInfoEntry({ ...editedInfoEntry!, title: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Category</Label>
                        <Input
                          value={editedInfoEntry?.category || ""}
                          onChange={(e) => setEditedInfoEntry({ ...editedInfoEntry!, category: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Content</Label>
                        <Textarea
                          value={editedInfoEntry?.content || ""}
                          onChange={(e) => setEditedInfoEntry({ ...editedInfoEntry!, content: e.target.value })}
                          rows={4}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveEditedInfo} size="sm" className="flex-1">
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button onClick={handleCancelEditInfo} size="sm" variant="outline" className="flex-1">
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{entry.title}</h4>
                        {entry.category && (
                          <p className="text-xs text-gray-600 mt-1">Category: {entry.category}</p>
                        )}
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{entry.content}</p>
                      </div>
                      {isEditingAdditionalInfo && (
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditInfoEntry(entry)}
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteInfoEntry(entry.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-8">
              No additional information added yet. Click "Add Information" to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
