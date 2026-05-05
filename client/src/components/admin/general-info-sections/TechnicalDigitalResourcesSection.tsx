import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Save, Globe, CreditCard, BookOpen, UserCheck, GraduationCap, Wifi, Server, ExternalLink } from "lucide-react";

interface TechnicalDigitalResourcesSectionProps {
  data: any;
  onUpdate: () => void;
}

export function TechnicalDigitalResourcesSection({ data, onUpdate }: TechnicalDigitalResourcesSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    overview: "RKSD College maintains a modern digital ecosystem centered on an in-house ERP portal, web OPAC for the library, campus Wi-Fi & smart classrooms, online fee payment, and an institutional e-repository / e-resources (NLIST/NDL links). The ERP also hosts student/employee logins, library records, fee & bus pass applications and attendance/records modules.",
    
    erp_url: "https://erp.rksdcollege.com",
    erp_capabilities: "Student and Employee login, Search Library Books, Apply for Bus Pass, Pay College Fee Online, Alumni Registration etc. ERP Capabilities (documented): Student/employee database, library integration, attendance & exam records, alumni, fee modules — screenshots and description published in the college AQAR/ERP PDF.",
    
    online_fee_url: "https://online.rksdcollege.com/Fee/PayFee",
    online_fee_description: "Students can pay fees online; after payment a form is downloadable which must be submitted to college office. ERP home also links to \"Pay College Fee Online\".",
    
    opac_url: "https://erp.rksdcollege.com/Admin/Library/SearchBook",
    opac_description: "Library OPAC available (SearchBook — erp.rksdcollege.com/Admin/Library/SearchBook) and campus web OPAC mirrors (campus OPAC pages). Students can search holdings online.",
    eresources_description: "College provides e-resources via N-LIST / NDL style access and hosts an institutional repository / teacher e-content (AQAR / Library pages).",
    
    attendance_system: "Attendance module: ERP contains attendance/recording modules (shown in ERP screenshots). For related institutes in the RKSD group (e.g., Pharmacy), a Biometric Attendance System is explicitly mentioned — indicating use or readiness for biometric integration across campus systems. Recommend confirming exact hardware (fingerprint/face) with admin if needed.",
    
    lms_status: "LMS status: RKSD publishes e-content & institutional repository (teacher-made content, uploaded resources). There is no separate branded LMS (like Moodle/Canvas) publicly advertised — learning content appears to be shared via the institutional repository / ERP / library links. If you need a full LMS entry, mark as \"Institutional e-repository; LMS = Not publicly listed (confirm with admin)\".",
    
    smart_classrooms_it: "Smart Classrooms / Wi-Fi: College lists 103 Wi-Fi enabled classrooms including 13 smart classrooms with ICT tools; campus-wide free Wi-Fi and computer labs support teaching. (See infrastructure & prospectus pages.)",
    computer_labs_it: "Computer Labs: Two (fully AC) computer labs with up-to-date systems & software (used for practicals).",
    
    data_backup: "Data & backup: ERP screenshots and AQAR describe centralized record keeping (student/employee/library). Specific backup/DR policy isn't published publicly — recommend asking the college IT/admin for details if required.",
    
    library_resources_url: "https://rksdcollege.ac.in/library-resources/",
  });

  const [isEditing, setIsEditing] = useState(false);

  const { data: technicalData } = useQuery({
    queryKey: ["/api/admin/general-info/technical-digital-resources"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/technical-digital-resources", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (technicalData) {
      setFormData({
        overview: technicalData.overview || formData.overview,
        erp_url: technicalData.erp_url || formData.erp_url,
        erp_capabilities: technicalData.erp_capabilities || formData.erp_capabilities,
        online_fee_url: technicalData.online_fee_url || formData.online_fee_url,
        online_fee_description: technicalData.online_fee_description || formData.online_fee_description,
        opac_url: technicalData.opac_url || formData.opac_url,
        opac_description: technicalData.opac_description || formData.opac_description,
        eresources_description: technicalData.eresources_description || formData.eresources_description,
        attendance_system: technicalData.attendance_system || formData.attendance_system,
        lms_status: technicalData.lms_status || formData.lms_status,
        smart_classrooms_it: technicalData.smart_classrooms_it || formData.smart_classrooms_it,
        computer_labs_it: technicalData.computer_labs_it || formData.computer_labs_it,
        data_backup: technicalData.data_backup || formData.data_backup,
        library_resources_url: technicalData.library_resources_url || formData.library_resources_url,
      });
    }
  }, [technicalData]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin/general-info/technical-digital-resources", {
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
      toast({ title: "Success", description: "Technical & Digital Resources information updated successfully" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info/technical-digital-resources"] });
      onUpdate();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Technical & Digital Resources</h2>
          <p className="text-sm text-gray-600">Manage digital infrastructure and online resources</p>
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

      {/* Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="overview">System Overview</Label>
            {isEditing ? (
              <Textarea
                id="overview"
                value={formData.overview}
                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                rows={4}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.overview}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Official ERP / Student Portal Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-600" />
            Official ERP / Student Portal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="erp_url">ERP URL / Student Login</Label>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  id="erp_url"
                  value={formData.erp_url}
                  onChange={(e) => setFormData({ ...formData, erp_url: e.target.value })}
                  placeholder="https://erp.rksdcollege.com"
                  className="mt-1"
                />
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <a 
                  href={formData.erp_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {formData.erp_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="erp_capabilities">ERP Capabilities</Label>
            {isEditing ? (
              <Textarea
                id="erp_capabilities"
                value={formData.erp_capabilities}
                onChange={(e) => setFormData({ ...formData, erp_capabilities: e.target.value })}
                rows={4}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.erp_capabilities}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Online Fee Payment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Online Fee Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="online_fee_url">Online Fee Portal</Label>
            {isEditing ? (
              <Input
                id="online_fee_url"
                value={formData.online_fee_url}
                onChange={(e) => setFormData({ ...formData, online_fee_url: e.target.value })}
                placeholder="https://online.rksdcollege.com/Fee/PayFee"
                className="mt-1"
              />
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <a 
                  href={formData.online_fee_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {formData.online_fee_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="online_fee_description">Description</Label>
            {isEditing ? (
              <Textarea
                id="online_fee_description"
                value={formData.online_fee_description}
                onChange={(e) => setFormData({ ...formData, online_fee_description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.online_fee_description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Library OPAC & E-Resources Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            Library OPAC & E-Resources / E-Repository
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="opac_url">Web OPAC / SearchBook</Label>
            {isEditing ? (
              <Input
                id="opac_url"
                value={formData.opac_url}
                onChange={(e) => setFormData({ ...formData, opac_url: e.target.value })}
                placeholder="https://erp.rksdcollege.com/Admin/Library/SearchBook"
                className="mt-1"
              />
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <a 
                  href={formData.opac_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {formData.opac_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="opac_description">OPAC Description</Label>
            {isEditing ? (
              <Textarea
                id="opac_description"
                value={formData.opac_description}
                onChange={(e) => setFormData({ ...formData, opac_description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.opac_description}</p>
            )}
          </div>
          <div>
            <Label htmlFor="eresources_description">E-Resources & Institutional Repository</Label>
            {isEditing ? (
              <Textarea
                id="eresources_description"
                value={formData.eresources_description}
                onChange={(e) => setFormData({ ...formData, eresources_description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.eresources_description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance / Biometric / Exam Records Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-orange-600" />
            Attendance / Biometric / Exam Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="attendance_system">Attendance Module</Label>
            {isEditing ? (
              <Textarea
                id="attendance_system"
                value={formData.attendance_system}
                onChange={(e) => setFormData({ ...formData, attendance_system: e.target.value })}
                rows={4}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.attendance_system}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Learning Management / E-Learning Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-cyan-600" />
            Learning Management / E-Learning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="lms_status">LMS Status</Label>
            {isEditing ? (
              <Textarea
                id="lms_status"
                value={formData.lms_status}
                onChange={(e) => setFormData({ ...formData, lms_status: e.target.value })}
                rows={4}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.lms_status}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Smart Classrooms, IT Labs & Connectivity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-blue-600" />
            Smart Classrooms, IT Labs & Connectivity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="smart_classrooms_it">Smart Classrooms / Wi-Fi</Label>
            {isEditing ? (
              <Textarea
                id="smart_classrooms_it"
                value={formData.smart_classrooms_it}
                onChange={(e) => setFormData({ ...formData, smart_classrooms_it: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.smart_classrooms_it}</p>
            )}
          </div>
          <div>
            <Label htmlFor="computer_labs_it">Computer Labs</Label>
            {isEditing ? (
              <Textarea
                id="computer_labs_it"
                value={formData.computer_labs_it}
                onChange={(e) => setFormData({ ...formData, computer_labs_it: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.computer_labs_it}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security, Backups & IT Support Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-gray-600" />
            Security, Backups & IT Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="data_backup">Data & Backup</Label>
            {isEditing ? (
              <Textarea
                id="data_backup"
                value={formData.data_backup}
                onChange={(e) => setFormData({ ...formData, data_backup: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.data_backup}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Useful Links Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            Useful Links (Direct)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">ERP / Student Login</span>
              <a 
                href={formData.erp_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Visit <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">Library OPAC / SearchBook</span>
              <a 
                href={formData.opac_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Visit <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">Online Fee Payment</span>
              <a 
                href={formData.online_fee_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Visit <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">Library Resources</span>
              {isEditing ? (
                <Input
                  value={formData.library_resources_url}
                  onChange={(e) => setFormData({ ...formData, library_resources_url: e.target.value })}
                  className="ml-2 h-8 text-xs w-64"
                />
              ) : (
                <a 
                  href={formData.library_resources_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  Visit <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {technicalData && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(technicalData.updated_at || Date.now()).toLocaleString()}
        </div>
      )}
    </div>
  );
}
