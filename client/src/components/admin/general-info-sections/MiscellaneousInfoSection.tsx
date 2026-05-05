import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Save, Phone, Mail, MapPin, Calendar, ShirtIcon, MessageSquare, Package, Plus, Trash2 } from "lucide-react";

interface MiscellaneousInfoSectionProps {
  data: any;
  onUpdate: () => void;
}

interface EmergencyContact {
  id: string;
  type: string;
  value: string;
}

interface HolidayEvent {
  id: string;
  name: string;
  date: string;
  description: string;
}

export function MiscellaneousInfoSection({ data, onUpdate }: MiscellaneousInfoSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    emergency_location: "Ambala Road, Kaithal – 136027, Haryana",
    
    holiday_description: "The college follows the academic calendar and holiday list set by Kurukshetra University, Kurukshetra.",
    holiday_download_info: "Students can download past academic calendars from the 'Academic Calendar' section on the college website.",
    holiday_current_session: "The official academic calendar for the current session is available on the Kurukshetra University website.",
    
    dress_code_policy: "Students are required to wear 'decent clothes' to maintain an academic environment.",
    dress_code_details: "No specific uniform is mandated, but overly casual, revealing, or inappropriate attire is not allowed.",
    dress_code_events: "For formal events and functions, students must dress appropriately as per college guidelines.",
    
    feedback_mechanism: "The college provides a feedback mechanism for students, alumni, employers, and faculty.",
    feedback_submission_process: "Students can submit suggestions via their department heads, contact the Grievance Cell, or approach the Principal's office directly.",
    feedback_reports_access: "Feedback reports may be accessed on the college website.",
    
    lost_found_description: "No dedicated Lost & Found desk is mentioned online.",
    lost_found_contact_info: "Students who lose or find items should contact college administration or campus security personnel.",
    lost_found_announcements: "Announcements regarding found items are typically posted on student notice boards.",
  });

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: "1", type: "College Phone Number", value: "01746 222368" },
    { id: "2", type: "College Email", value: "rksdcollegektl@yahoo.com" },
    { id: "3", type: "Principal Email", value: "principal@rksdcollege.ac.in" },
  ]);

  const [holidayEvents, setHolidayEvents] = useState<HolidayEvent[]>([
    { id: "1", name: "Republic Day", date: "26 January 2025", description: "National Holiday" },
    { id: "2", name: "Independence Day", date: "15 August 2025", description: "National Holiday" },
  ]);

  const [newContact, setNewContact] = useState({ type: "", value: "" });
  const [newHoliday, setNewHoliday] = useState({ name: "", date: "", description: "" });
  const [isEditing, setIsEditing] = useState(false);

  const { data: miscInfoData } = useQuery({
    queryKey: ["/api/admin/general-info/miscellaneous"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/miscellaneous", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (miscInfoData && Object.keys(miscInfoData).length > 0) {
      setFormData({
        emergency_location: miscInfoData.emergency_location || formData.emergency_location,
        holiday_description: miscInfoData.holiday_description || formData.holiday_description,
        holiday_download_info: miscInfoData.holiday_download_info || formData.holiday_download_info,
        holiday_current_session: miscInfoData.holiday_current_session || formData.holiday_current_session,
        dress_code_policy: miscInfoData.dress_code_policy || formData.dress_code_policy,
        dress_code_details: miscInfoData.dress_code_details || formData.dress_code_details,
        dress_code_events: miscInfoData.dress_code_events || formData.dress_code_events,
        feedback_mechanism: miscInfoData.feedback_mechanism || formData.feedback_mechanism,
        feedback_submission_process: miscInfoData.feedback_submission_process || formData.feedback_submission_process,
        feedback_reports_access: miscInfoData.feedback_reports_access || formData.feedback_reports_access,
        lost_found_description: miscInfoData.lost_found_description || formData.lost_found_description,
        lost_found_contact_info: miscInfoData.lost_found_contact_info || formData.lost_found_contact_info,
        lost_found_announcements: miscInfoData.lost_found_announcements || formData.lost_found_announcements,
      });

      if (miscInfoData.emergency_contacts && miscInfoData.emergency_contacts.length > 0) {
        setEmergencyContacts(miscInfoData.emergency_contacts);
      }

      if (miscInfoData.holiday_events && miscInfoData.holiday_events.length > 0) {
        setHolidayEvents(miscInfoData.holiday_events);
      }
    }
  }, [miscInfoData]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/general-info/miscellaneous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Miscellaneous information updated successfully" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info/miscellaneous"] });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...formData,
      emergency_contacts: emergencyContacts,
      holiday_events: holidayEvents,
    });
  };

  const addEmergencyContact = () => {
    if (newContact.type.trim() && newContact.value.trim()) {
      setEmergencyContacts([...emergencyContacts, { 
        id: Date.now().toString(), 
        type: newContact.type, 
        value: newContact.value 
      }]);
      setNewContact({ type: "", value: "" });
    }
  };

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts(emergencyContacts.filter(c => c.id !== id));
  };

  const updateEmergencyContact = (id: string, field: keyof EmergencyContact, value: string) => {
    setEmergencyContacts(emergencyContacts.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const addHolidayEvent = () => {
    if (newHoliday.name.trim() && newHoliday.date.trim()) {
      setHolidayEvents([...holidayEvents, { 
        id: Date.now().toString(), 
        name: newHoliday.name, 
        date: newHoliday.date,
        description: newHoliday.description
      }]);
      setNewHoliday({ name: "", date: "", description: "" });
    }
  };

  const removeHolidayEvent = (id: string) => {
    setHolidayEvents(holidayEvents.filter(h => h.id !== id));
  };

  const updateHolidayEvent = (id: string, field: keyof HolidayEvent, value: string) => {
    setHolidayEvents(holidayEvents.map(h => 
      h.id === id ? { ...h, [field]: value } : h
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Other / Miscellaneous Information</h2>
          <p className="text-sm text-gray-600">Manage emergency contacts, calendar, dress code, feedback and lost & found information</p>
        </div>
        <Button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={saveMutation.isPending}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </div>

      {/* Emergency Contacts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-red-600" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="emergency_location">College Location</Label>
            <Textarea
              id="emergency_location"
              value={formData.emergency_location}
              onChange={(e) => setFormData({ ...formData, emergency_location: e.target.value })}
              disabled={!isEditing}
              rows={2}
              placeholder="Ambala Road, Kaithal – 136027, Haryana"
            />
          </div>

          <div className="space-y-3">
            <Label>Contact Details</Label>
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="flex gap-2 items-start p-3 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Input
                    value={contact.type}
                    onChange={(e) => updateEmergencyContact(contact.id, "type", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Contact Type (e.g., College Phone)"
                  />
                  <Input
                    value={contact.value}
                    onChange={(e) => updateEmergencyContact(contact.id, "value", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Contact Value"
                  />
                </div>
                {isEditing && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeEmergencyContact(contact.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {isEditing && (
              <div className="flex gap-2 items-start p-3 border-2 border-dashed rounded-lg">
                <div className="flex-1 space-y-2">
                  <Input
                    value={newContact.type}
                    onChange={(e) => setNewContact({ ...newContact, type: e.target.value })}
                    placeholder="Contact Type"
                  />
                  <Input
                    value={newContact.value}
                    onChange={(e) => setNewContact({ ...newContact, value: e.target.value })}
                    placeholder="Contact Value"
                  />
                </div>
                <Button onClick={addEmergencyContact} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Holiday List / Academic Calendar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Holiday List / Academic Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="holiday_description">Calendar Overview</Label>
            <Textarea
              id="holiday_description"
              value={formData.holiday_description}
              onChange={(e) => setFormData({ ...formData, holiday_description: e.target.value })}
              disabled={!isEditing}
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="holiday_download_info">Past Calendars Download Information</Label>
            <Textarea
              id="holiday_download_info"
              value={formData.holiday_download_info}
              onChange={(e) => setFormData({ ...formData, holiday_download_info: e.target.value })}
              disabled={!isEditing}
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="holiday_current_session">Current Session Calendar</Label>
            <Textarea
              id="holiday_current_session"
              value={formData.holiday_current_session}
              onChange={(e) => setFormData({ ...formData, holiday_current_session: e.target.value })}
              disabled={!isEditing}
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Holiday & Important Events</Label>
            {holidayEvents.map((event) => (
              <div key={event.id} className="flex gap-2 items-start p-3 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Input
                    value={event.name}
                    onChange={(e) => updateHolidayEvent(event.id, "name", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Event Name"
                  />
                  <Input
                    value={event.date}
                    onChange={(e) => updateHolidayEvent(event.id, "date", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Date"
                  />
                  <Input
                    value={event.description}
                    onChange={(e) => updateHolidayEvent(event.id, "description", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Description (optional)"
                  />
                </div>
                {isEditing && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeHolidayEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {isEditing && (
              <div className="flex gap-2 items-start p-3 border-2 border-dashed rounded-lg">
                <div className="flex-1 space-y-2">
                  <Input
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                    placeholder="Event Name"
                  />
                  <Input
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    placeholder="Date"
                  />
                  <Input
                    value={newHoliday.description}
                    onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                    placeholder="Description (optional)"
                  />
                </div>
                <Button onClick={addHolidayEvent} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dress Code Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShirtIcon className="h-5 w-5 text-purple-600" />
            Dress Code Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="dress_code_policy">Dress Code Policy</Label>
            <Textarea
              id="dress_code_policy"
              value={formData.dress_code_policy}
              onChange={(e) => setFormData({ ...formData, dress_code_policy: e.target.value })}
              disabled={!isEditing}
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="dress_code_details">Dress Code Details</Label>
            <Textarea
              id="dress_code_details"
              value={formData.dress_code_details}
              onChange={(e) => setFormData({ ...formData, dress_code_details: e.target.value })}
              disabled={!isEditing}
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="dress_code_events">Formal Events Requirements</Label>
            <Textarea
              id="dress_code_events"
              value={formData.dress_code_events}
              onChange={(e) => setFormData({ ...formData, dress_code_events: e.target.value })}
              disabled={!isEditing}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feedback / Suggestion Form Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Feedback / Suggestion Form
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="feedback_mechanism">Feedback Mechanism</Label>
            <Textarea
              id="feedback_mechanism"
              value={formData.feedback_mechanism}
              onChange={(e) => setFormData({ ...formData, feedback_mechanism: e.target.value })}
              disabled={!isEditing}
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="feedback_submission_process">Submission Process</Label>
            <Textarea
              id="feedback_submission_process"
              value={formData.feedback_submission_process}
              onChange={(e) => setFormData({ ...formData, feedback_submission_process: e.target.value })}
              disabled={!isEditing}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="feedback_reports_access">Feedback Reports Access</Label>
            <Textarea
              id="feedback_reports_access"
              value={formData.feedback_reports_access}
              onChange={(e) => setFormData({ ...formData, feedback_reports_access: e.target.value })}
              disabled={!isEditing}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lost & Found Desk Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-600" />
            Lost & Found Desk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="lost_found_description">Lost & Found Information</Label>
            <Textarea
              id="lost_found_description"
              value={formData.lost_found_description}
              onChange={(e) => setFormData({ ...formData, lost_found_description: e.target.value })}
              disabled={!isEditing}
              rows={2}
            />
          </div>
          
          <div>
            <Label htmlFor="lost_found_contact_info">Contact Information</Label>
            <Textarea
              id="lost_found_contact_info"
              value={formData.lost_found_contact_info}
              onChange={(e) => setFormData({ ...formData, lost_found_contact_info: e.target.value })}
              disabled={!isEditing}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="lost_found_announcements">Announcements</Label>
            <Textarea
              id="lost_found_announcements"
              value={formData.lost_found_announcements}
              onChange={(e) => setFormData({ ...formData, lost_found_announcements: e.target.value })}
              disabled={!isEditing}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
