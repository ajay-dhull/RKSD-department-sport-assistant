import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Save, BookOpen, History as HistoryIcon, User, Target, Heart } from "lucide-react";

interface AboutHistoryOverviewSectionProps {
  data: any;
  onUpdate: () => void;
}

export function AboutHistoryOverviewSection({ data, onUpdate }: AboutHistoryOverviewSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    short_overview: "Founded in 1954 by philanthropist Seth Makhan Lal, Radha Krishan Sanatan Dharm (PG) College (RKSD) is a prestigious, government-aided institution dedicated to delivering quality higher education in Kaithal, Haryana. Affiliated to Kurukshetra University, the college has grown from an intermediate institution to a multi-faculty post-graduate college, blending traditional values with modern academics and community-oriented learning.",
    
    detailed_history: `Early 1950s — The Need for Higher Education:
Kaithal, though a prominent trade centre, lacked institutions for higher studies. Local students had to travel to distant cities to pursue college education.

1953–1954 — Formation of Rashtriya Vidya Samiti (RVS):
Inspired by community leaders and led by Seth Makhan Lal, the idea of founding a college took shape. The Rashtriya Vidya Samiti (Regd.), Kaithal, was officially registered in 1954 under the Societies Registration Act XXI of 1860.

1954 — Establishment of RKSD College:
The college was founded as an Intermediate College in a rented building and named after Seth Makhan Lal's father-in-law, Shri Radha Krishan Ji. Later, it shifted to its current campus spread over 10 acres on the Ambala–Hisar Highway.

1976 — Attaining Post-Graduate Status:
RKSD College achieved PG status with the introduction of M.A. (Hindi). Subsequently, it expanded into multiple disciplines, adding M.A. (Political Science, English), M.Sc. (Mathematics), BBA, and BCA programmes.

2003 — Introduction of Evening Session:
To accommodate more students, the Government of Haryana and Kurukshetra University permitted the college to begin Evening Session classes.

2017 — NAAC Accreditation:
The college was accredited with an 'A' Grade by NAAC, affirming its commitment to academic excellence, quality assurance, and institutional growth.

Ongoing Development:
RKSD continues to evolve through academic innovation, infrastructural expansion, and community engagement, positioning itself as a model of holistic education in Haryana.`,

    founder_story: `The founder, Seth Makhan Lal (1909–1965), a visionary philanthropist of the Aggarwal community, recognized Kaithal's urgent need for higher education. He generously donated his movable and immovable property to the Rashtriya Vidya Samiti, laying the foundation for RKSD College in 1954. Under his leadership, and with support from other community members, the college became a beacon of education and social upliftment in the region.`,

    vision_statement: `To impart quality education by consistently incorporating the latest advancements and global learning traditions — transforming lives, empowering future leaders, and contributing to the holistic development of society while preserving India's cultural heritage.`,

    mission_statement: `• To create a dynamic and progressive learning environment fostering curiosity, critical thinking, and innovation.
• To nurture well-rounded individuals who excel academically and contribute positively to the community.
• To equip students with modern skills and knowledge essential for success in a rapidly changing global landscape.
• To integrate ethical values and social responsibility in education.`,

    core_values: `• Academic Excellence: Maintaining high standards in teaching, learning, and research.
• Inclusivity & Pluralism: Offering accessible education to all, respecting diversity and equality.
• Holistic Development: Promoting balanced growth through academics, sports, and cultural activities.
• Ethics & Integrity: Upholding honesty, transparency, and moral conduct in all endeavors.
• Community Engagement: Encouraging social responsibility and outreach for societal betterment.`,
  });

  const [isEditing, setIsEditing] = useState(false);

  const { data: aboutData } = useQuery({
    queryKey: ["/api/admin/general-info/about-history-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/about-history-overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (aboutData) {
      setFormData({
        short_overview: aboutData.short_overview || formData.short_overview,
        detailed_history: aboutData.detailed_history || formData.detailed_history,
        founder_story: aboutData.founder_story || formData.founder_story,
        vision_statement: aboutData.vision_statement || formData.vision_statement,
        mission_statement: aboutData.mission_statement || formData.mission_statement,
        core_values: aboutData.core_values || formData.core_values,
      });
    }
  }, [aboutData]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/general-info/about-history-overview", {
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
      toast({ title: "Success", description: "About / History / Overview updated successfully" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info/about-history-overview"] });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">About / History / Overview</h3>
          <p className="text-sm text-gray-600 mt-1">Complete information about college history, vision, mission, and values</p>
        </div>
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
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Short Overview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Short Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={formData.short_overview}
                onChange={(e) => handleChange("short_overview", e.target.value)}
                disabled={!isEditing}
                rows={5}
                className="w-full"
                placeholder="Brief overview of the college..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Detailed History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HistoryIcon className="h-5 w-5 text-purple-600" />
              Detailed History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={formData.detailed_history}
                onChange={(e) => handleChange("detailed_history", e.target.value)}
                disabled={!isEditing}
                rows={15}
                className="w-full font-mono text-sm"
                placeholder="Complete historical timeline of the college..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Founder Story Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-green-600" />
              Founder / Establishment Story
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={formData.founder_story}
                onChange={(e) => handleChange("founder_story", e.target.value)}
                disabled={!isEditing}
                rows={6}
                className="w-full"
                placeholder="Information about the founder and establishment..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Vision Statement Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-orange-600" />
              Vision Statement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={formData.vision_statement}
                onChange={(e) => handleChange("vision_statement", e.target.value)}
                disabled={!isEditing}
                rows={4}
                className="w-full"
                placeholder="College vision statement..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Mission Statement Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-5 w-5 text-red-600" />
              Mission Statement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={formData.mission_statement}
                onChange={(e) => handleChange("mission_statement", e.target.value)}
                disabled={!isEditing}
                rows={6}
                className="w-full"
                placeholder="College mission statement with bullet points..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Core Values Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-5 w-5 text-pink-600" />
              Core Values
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={formData.core_values}
                onChange={(e) => handleChange("core_values", e.target.value)}
                disabled={!isEditing}
                rows={6}
                className="w-full"
                placeholder="Core values of the institution..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {aboutData && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(aboutData.updated_at || Date.now()).toLocaleString()}
        </div>
      )}
    </div>
  );
}
