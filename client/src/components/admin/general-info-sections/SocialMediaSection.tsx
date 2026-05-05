import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Save, Edit, Facebook, Instagram, Youtube, Linkedin, Twitter, Smartphone, ExternalLink } from "lucide-react";

interface SocialMediaSectionProps {
  data: any;
  onUpdate: () => void;
}

export function SocialMediaSection({ data, onUpdate }: SocialMediaSectionProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    facebook: "",
    instagram: "",
    youtube: "",
    linkedin: "",
    twitter: "",
    app_link: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  const { data: socialMediaData } = useQuery({
    queryKey: ["/api/admin/general-info/social-media"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/social-media", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (socialMediaData) {
      setFormData({
        facebook: socialMediaData.facebook || "",
        instagram: socialMediaData.instagram || "",
        youtube: socialMediaData.youtube || "",
        linkedin: socialMediaData.linkedin || "",
        twitter: socialMediaData.twitter || "",
        app_link: socialMediaData.app_link || "",
      });
    }
  }, [socialMediaData]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/general-info/social-media", {
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
      toast({ title: "Success", description: "Social media links updated successfully" });
      setIsEditing(false);
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const socialPlatforms = [
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      placeholder: "https://facebook.com/yourcollegepage",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: Instagram,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      placeholder: "https://instagram.com/yourcollegepage",
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: Youtube,
      color: "text-red-600",
      bgColor: "bg-red-50",
      placeholder: "https://youtube.com/@yourcollegechannel",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      placeholder: "https://linkedin.com/company/yourcollegepage",
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: Twitter,
      color: "text-gray-900",
      bgColor: "bg-gray-50",
      placeholder: "https://twitter.com/yourcollegepage",
    },
    {
      id: "app_link",
      name: "Official App",
      icon: Smartphone,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      placeholder: "https://play.google.com/store/apps/...",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Social Media & Online Presence</h3>
          <p className="text-sm text-gray-600 mt-1">Connect your college's social media profiles</p>
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
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {socialPlatforms.map((platform) => {
          const Icon = platform.icon;
          const fieldValue = formData[platform.id as keyof typeof formData];
          
          return (
            <Card key={platform.id} className="overflow-hidden">
              <CardHeader className={`pb-3 ${isEditing ? '' : fieldValue ? platform.bgColor : 'bg-gray-50'}`}>
                <CardTitle className="text-base flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${platform.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${platform.color}`} />
                  </div>
                  {platform.name}
                  {!isEditing && fieldValue && (
                    <a
                      href={fieldValue}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                    </a>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <Label htmlFor={platform.id}>Profile URL</Label>
                  <Input
                    id={platform.id}
                    type="url"
                    value={fieldValue}
                    onChange={(e) => setFormData({ ...formData, [platform.id]: e.target.value })}
                    disabled={!isEditing}
                    placeholder={platform.placeholder}
                  />
                  {!isEditing && !fieldValue && (
                    <p className="text-xs text-gray-500">Not configured</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Section */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Links Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                const fieldValue = formData[platform.id as keyof typeof formData];
                
                if (!fieldValue) return null;
                
                return (
                  <a
                    key={platform.id}
                    href={fieldValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${platform.bgColor} ${platform.color} hover:opacity-80 transition-opacity`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{platform.name}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                );
              })}
              
              {!Object.values(formData).some(v => v) && (
                <p className="text-sm text-gray-500">No social media links configured yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {socialMediaData && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(socialMediaData.updated_at || Date.now()).toLocaleString()}
        </div>
      )}
    </div>
  );
}
