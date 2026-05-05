import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Search,
  Building2,
  History,
  Library,
  GraduationCap,
  Share2,
  Bell,
  BarChart3,
  ChevronRight,
  Clock,
  Edit,
  X,
  Plus,
  Users,
  FileText,
  Award,
  Building,
  Globe,
  HandHeart,
  Trophy,
  TreePine,
  Shield,
  AlertCircle,
  Info,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sub-section imports (will create these components)
import { BasicDetailsSection } from "./general-info-sections/BasicDetailsSection";
import { AboutHistoryOverviewSection } from "./general-info-sections/AboutHistoryOverviewSection";
import { AdministrationManagementSection } from "./general-info-sections/AdministrationManagementSection";
import { AdmissionEligibilitySection } from "./general-info-sections/AdmissionEligibilitySection";
import { ScholarshipsFinancialAidSection } from "./general-info-sections/ScholarshipsFinancialAidSection";
import { FacilitiesInfrastructureSection } from "./general-info-sections/FacilitiesInfrastructureSection";
import { TechnicalDigitalResourcesSection } from "./general-info-sections/TechnicalDigitalResourcesSection";
import { StudentSupportServicesSection } from "./general-info-sections/StudentSupportServicesSection";
import { AchievementsRecognitionsSection } from "./general-info-sections/AchievementsRecognitionsSection";
import { CampusEnvironmentSection } from "./general-info-sections/CampusEnvironmentSection";
import { RulesRegulationsSection } from "./general-info-sections/RulesRegulationsSection";
import { MiscellaneousInfoSection } from "./general-info-sections/MiscellaneousInfoSection";
import { AdditionalInfoSection } from "./general-info-sections/AdditionalInfoSection";

interface SubSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  component: any;
}

interface SearchResult {
  sectionId: string;
  sectionTitle: string;
  fieldName: string;
  fieldValue: string;
  matchType: 'exact' | 'partial';
}

export function GeneralInfoSectionNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const token = localStorage.getItem("adminToken");

  // Define all sub-sections
  const subSections: SubSection[] = [
    {
      id: "basic-details",
      title: "Basic Details",
      description: "College name, affiliation, principal, contact info",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      component: BasicDetailsSection,
    },
    {
      id: "about-history-overview",
      title: "About / History / Overview",
      description: "College overview, history, founder, vision, mission, and values",
      icon: History,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      component: AboutHistoryOverviewSection,
    },
    {
      id: "administration-management",
      title: "Administration / Management",
      description: "Principal, governing body, committees, and department heads",
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      component: AdministrationManagementSection,
    },
    {
      id: "admission-eligibility",
      title: "Admission & Eligibility",
      description: "Admission process, eligibility criteria, documents, and fee structure",
      icon: FileText,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      component: AdmissionEligibilitySection,
    },
    {
      id: "scholarships-financial-aid",
      title: "Scholarships & Financial Aid",
      description: "College scholarships, government schemes, and application process",
      icon: Award,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      component: ScholarshipsFinancialAidSection,
    },
    {
      id: "facilities-infrastructure",
      title: "Facilities & Infrastructure",
      description: "Library, labs, sports, hostel, canteen, medical, transport, and campus facilities",
      icon: Building,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      component: FacilitiesInfrastructureSection,
    },
    {
      id: "technical-digital-resources",
      title: "Technical & Digital Resources",
      description: "ERP, online fee payment, library OPAC, e-resources, and IT infrastructure",
      icon: Globe,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      component: TechnicalDigitalResourcesSection,
    },
    {
      id: "student-support-services",
      title: "Student Support & Services",
      description: "Career guidance, placement, grievance, anti-ragging, women cell, alumni, NSS/NCC",
      icon: HandHeart,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      component: StudentSupportServicesSection,
    },
    {
      id: "achievements-recognitions",
      title: "Achievements & Recognitions",
      description: "College awards, NAAC grade, faculty & student achievements, notable alumni",
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      component: AchievementsRecognitionsSection,
    },
    {
      id: "campus-environment",
      title: "Campus & Environment",
      description: "Campus area, green initiatives, safety measures, and emergency preparedness",
      icon: TreePine,
      color: "text-green-600",
      bgColor: "bg-green-50",
      component: CampusEnvironmentSection,
    },
    {
      id: "rules-regulations",
      title: "Rules & Regulations",
      description: "Attendance rules, examination policy, dress code, and disciplinary policies",
      icon: Shield,
      color: "text-red-600",
      bgColor: "bg-red-50",
      component: RulesRegulationsSection,
    },
    {
      id: "miscellaneous-info",
      title: "Other / Miscellaneous Information",
      description: "Emergency contacts, calendar, dress code, feedback, and lost & found",
      icon: Info,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      component: MiscellaneousInfoSection,
    },
    {
      id: "additional-info",
      title: "Additional Information",
      description: "Custom information with AI or Manual modes",
      icon: Plus,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      component: AdditionalInfoSection,
    },
  ];

  // Fetch all general info data
  const { data: generalInfoData, isLoading } = useQuery({
    queryKey: ["/api/admin/general-info-all"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info-all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch data");
      return await res.json();
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("general-info-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "college_settings" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info-all"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Helper function to recursively search nested structures
  const searchNestedValue = (
    value: any,
    sectionId: string,
    sectionTitle: string,
    parentKey: string,
    query: string,
    results: SearchResult[]
  ) => {
    if (!value) return;

    if (Array.isArray(value)) {
      // Handle arrays
      value.forEach((item: any) => {
        const searchableText = JSON.stringify(item).toLowerCase();
        if (searchableText.includes(query)) {
          results.push({
            sectionId,
            sectionTitle,
            fieldName: item.name || item.title || item.department || item.event || parentKey.replace(/_/g, " "),
            fieldValue: item.description || item.requirements || item.headName || item.timeline || JSON.stringify(item).substring(0, 100),
            matchType: searchableText === query ? "exact" : "partial",
          });
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      // Handle nested objects recursively
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        if (typeof nestedValue === 'string' && nestedValue.toLowerCase().includes(query)) {
          results.push({
            sectionId,
            sectionTitle,
            fieldName: `${parentKey.replace(/_/g, " ")} - ${nestedKey.replace(/_/g, " ")}`.replace(/\b\w/g, (l) => l.toUpperCase()),
            fieldValue: nestedValue.substring(0, 100) + (nestedValue.length > 100 ? "..." : ""),
            matchType: nestedValue.toLowerCase() === query ? "exact" : "partial",
          });
        } else if (typeof nestedValue === 'object') {
          // Recursively search deeper levels
          searchNestedValue(nestedValue, sectionId, sectionTitle, `${parentKey} ${nestedKey}`, query, results);
        }
      });
    } else if (typeof value === 'string' && value.toLowerCase().includes(query)) {
      // Handle simple strings
      results.push({
        sectionId,
        sectionTitle,
        fieldName: parentKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        fieldValue: value.substring(0, 100) + (value.length > 100 ? "..." : ""),
        matchType: value.toLowerCase() === query ? "exact" : "partial",
      });
    }
  };

  // Advanced search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];
    const query = searchQuery.toLowerCase();

    // Search through all active sections and fields
    if (generalInfoData) {
      // Search in Basic Details
      const basicDetails = generalInfoData.basicDetails || {};
      Object.entries(basicDetails).forEach(([key, value]) => {
        if (value && String(value).toLowerCase().includes(query)) {
          results.push({
            sectionId: "basic-details",
            sectionTitle: "Basic Details",
            fieldName: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            fieldValue: String(value),
            matchType: String(value).toLowerCase() === query ? "exact" : "partial",
          });
        }
      });

      // Search in About/History/Overview
      const aboutHistory = generalInfoData.aboutHistory || {};
      Object.entries(aboutHistory).forEach(([key, value]) => {
        if (value && String(value).toLowerCase().includes(query)) {
          results.push({
            sectionId: "about-history-overview",
            sectionTitle: "About / History / Overview",
            fieldName: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            fieldValue: String(value).substring(0, 100) + (String(value).length > 100 ? "..." : ""),
            matchType: String(value).toLowerCase() === query ? "exact" : "partial",
          });
        }
      });

      // Search in Administration/Management
      const administrationManagement = generalInfoData.administrationManagement || {};
      Object.entries(administrationManagement).forEach(([key, value]) => {
        searchNestedValue(value, "administration-management", "Administration / Management", key, query, results);
      });

      // Search in Admission & Eligibility
      const admissionEligibility = generalInfoData.admissionEligibility || {};
      Object.entries(admissionEligibility).forEach(([key, value]) => {
        searchNestedValue(value, "admission-eligibility", "Admission & Eligibility", key, query, results);
      });

      // Search in Scholarships & Financial Aid
      const scholarshipsFinancialAid = generalInfoData.scholarshipsFinancialAid || {};
      Object.entries(scholarshipsFinancialAid).forEach(([key, value]) => {
        searchNestedValue(value, "scholarships-financial-aid", "Scholarships & Financial Aid", key, query, results);
      });

      // Search in Facilities & Infrastructure
      const facilitiesInfrastructure = generalInfoData.facilitiesInfrastructure || {};
      Object.entries(facilitiesInfrastructure).forEach(([key, value]) => {
        searchNestedValue(value, "facilities-infrastructure", "Facilities & Infrastructure", key, query, results);
      });

      // Search in Technical & Digital Resources
      const technicalDigitalResources = generalInfoData.technicalDigitalResources || {};
      Object.entries(technicalDigitalResources).forEach(([key, value]) => {
        searchNestedValue(value, "technical-digital-resources", "Technical & Digital Resources", key, query, results);
      });

      // Search in Student Support & Services
      const studentSupportServices = generalInfoData.studentSupportServices || {};
      Object.entries(studentSupportServices).forEach(([key, value]) => {
        searchNestedValue(value, "student-support-services", "Student Support & Services", key, query, results);
      });

      // Search in Achievements & Recognitions
      const achievementsRecognitions = generalInfoData.achievementsRecognitions || {};
      Object.entries(achievementsRecognitions).forEach(([key, value]) => {
        searchNestedValue(value, "achievements-recognitions", "Achievements & Recognitions", key, query, results);
      });

      // Search in Campus & Environment
      const campusEnvironment = generalInfoData.campusEnvironment || {};
      Object.entries(campusEnvironment).forEach(([key, value]) => {
        searchNestedValue(value, "campus-environment", "Campus & Environment", key, query, results);
      });

      // Search in Rules & Regulations
      const rulesRegulations = generalInfoData.rulesRegulations || {};
      Object.entries(rulesRegulations).forEach(([key, value]) => {
        searchNestedValue(value, "rules-regulations", "Rules & Regulations", key, query, results);
      });

      // Search in Miscellaneous Information
      const miscellaneous = generalInfoData.miscellaneous || {};
      Object.entries(miscellaneous).forEach(([key, value]) => {
        searchNestedValue(value, "miscellaneous-info", "Other / Miscellaneous Information", key, query, results);
      });

      // Search in Additional Information
      const additionalInfo = generalInfoData.additionalInfo?.entries || [];
      additionalInfo.forEach((entry: any) => {
        if (entry.title?.toLowerCase().includes(query) || entry.content?.toLowerCase().includes(query)) {
          results.push({
            sectionId: "additional-info",
            sectionTitle: "Additional Information",
            fieldName: entry.title,
            fieldValue: entry.content?.substring(0, 100) + (entry.content?.length > 100 ? "..." : "") || "",
            matchType: entry.title?.toLowerCase() === query ? "exact" : "partial",
          });
        }
      });
    }

    // Sort results: exact matches first
    results.sort((a, b) => {
      if (a.matchType === "exact" && b.matchType === "partial") return -1;
      if (a.matchType === "partial" && b.matchType === "exact") return 1;
      return 0;
    });

    setSearchResults(results);
    setIsSearching(false);
  }, [searchQuery, generalInfoData]);

  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(sectionId);
  };

  const handleCloseSheet = () => {
    setSelectedSection(null);
  };

  const handleSearchResultClick = (result: SearchResult) => {
    // Only open if the section exists in our subSections array
    const sectionExists = subSections.find(s => s.id === result.sectionId);
    if (sectionExists) {
      setSelectedSection(result.sectionId);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const selectedSectionData = subSections.find((s) => s.id === selectedSection);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">General Information</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage all college information across different categories
          </p>
        </div>

        {/* Advanced Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search across all sections... (e.g., 'library', 'fees', 'principal')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base border-2 focus:border-blue-500"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <Card className="absolute top-full mt-2 w-full z-50 shadow-lg max-h-96 overflow-auto">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={result.matchType === "exact" ? "default" : "secondary"} className="text-xs">
                              {result.sectionTitle}
                            </Badge>
                            {result.matchType === "exact" && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Exact Match
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-sm text-gray-900">{result.fieldName}</p>
                          <p className="text-xs text-gray-600 truncate mt-1">{result.fieldValue}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results */}
          {searchQuery && searchResults.length === 0 && !isSearching && (
            <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
              <CardContent className="p-4 text-center text-sm text-gray-600">
                No results found for "{searchQuery}"
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sub-Sections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {subSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-2 hover:border-gray-300"
              onClick={() => handleSectionClick(section.id)}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`h-6 w-6 ${section.color}`} />
                </div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Updated recently</span>
                  </div>
                  <ChevronRight className={`h-5 w-5 ${section.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section Detail Sheet/Drawer */}
      <Sheet open={!!selectedSection} onOpenChange={(open) => !open && handleCloseSheet()}>
        <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-4xl overflow-y-auto p-0">
          {selectedSectionData && (
            <>
              <SheetHeader className="p-6 pb-4 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${selectedSectionData.bgColor} flex items-center justify-center`}>
                    <selectedSectionData.icon className={`h-5 w-5 ${selectedSectionData.color}`} />
                  </div>
                  <div>
                    <SheetTitle className="text-xl">{selectedSectionData.title}</SheetTitle>
                    <SheetDescription>{selectedSectionData.description}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)]">
                <div className="p-6">
                  <selectedSectionData.component
                    data={generalInfoData}
                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info-all"] })}
                  />
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
