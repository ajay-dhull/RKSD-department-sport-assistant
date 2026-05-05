import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, ExternalLink, Star, StarOff, ArrowRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface NewsAnnouncementsSectionProps {
  data: any;
  onUpdate: () => void;
}

interface NewsItem {
  id: string;
  title: string;
  content?: string;
  created_at: string;
  notice_type?: string;
  priority?: string;
}

export function NewsAnnouncementsSection({ data, onUpdate }: NewsAnnouncementsSectionProps) {
  const { toast } = useToast();
  const token = localStorage.getItem("adminToken");
  
  const [highlightedNewsIds, setHighlightedNewsIds] = useState<string[]>([]);

  // Fetch all news/notices
  const { data: newsData } = useQuery({
    queryKey: ["/api/admin/general-info/news-announcements"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/news-announcements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (newsData?.highlighted) {
      setHighlightedNewsIds(newsData.highlighted);
    }
  }, [newsData]);

  const saveMutation = useMutation({
    mutationFn: async (highlightedIds: string[]) => {
      const res = await fetch("/api/admin/general-info/news-announcements/highlight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ highlighted: highlightedIds }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Top announcements updated successfully" });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleToggleHighlight = (newsId: string) => {
    const newHighlighted = highlightedNewsIds.includes(newsId)
      ? highlightedNewsIds.filter((id) => id !== newsId)
      : [...highlightedNewsIds.slice(0, 2), newsId]; // Max 3 items

    if (newHighlighted.length > 3) {
      toast({
        title: "Limit Reached",
        description: "You can only highlight up to 3 announcements",
        variant: "destructive",
      });
      return;
    }

    setHighlightedNewsIds(newHighlighted);
  };

  const handleSave = () => {
    saveMutation.mutate(highlightedNewsIds);
  };

  const allNews: NewsItem[] = newsData?.news || [];
  const totalCount = allNews.length;
  const highlightedNews = allNews.filter((item) => highlightedNewsIds.includes(item.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">News & Announcements</h3>
          <p className="text-sm text-gray-600 mt-1">Manage highlighted announcements for General Info</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          variant={highlightedNewsIds.length > 0 ? "default" : "outline"}
        >
          {saveMutation.isPending ? "Saving..." : "Save Highlights"}
        </Button>
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
              <p className="text-xs text-gray-600">Total Active News</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{highlightedNewsIds.length}</p>
              <p className="text-xs text-gray-600">Highlighted (Max 3)</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <a
                href="/head-admin?tab=notices"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium"
              >
                Manage All News
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Highlighted Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            Top Highlighted Announcements
          </CardTitle>
          <p className="text-xs text-gray-600 mt-1">
            These will be prominently displayed in the General Information section
          </p>
        </CardHeader>
        <CardContent>
          {highlightedNews.length > 0 ? (
            <div className="space-y-3">
              {highlightedNews.map((item, index) => (
                <div
                  key={item.id}
                  className="border-2 border-yellow-200 rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-amber-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-white text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h4 className="font-semibold text-gray-900 flex-1">{item.title}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleHighlight(item.id)}
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          <StarOff className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.content && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.content}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {item.notice_type && (
                          <Badge variant="outline" className="text-xs">
                            {item.notice_type}
                          </Badge>
                        )}
                        {item.priority && (
                          <Badge
                            variant={item.priority === "urgent" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {item.priority}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Star className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No announcements highlighted yet</p>
              <p className="text-xs mt-1">Select up to 3 announcements from the list below</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All News Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All News & Announcements</CardTitle>
          <p className="text-xs text-gray-600 mt-1">
            Select up to 3 announcements to highlight
          </p>
        </CardHeader>
        <CardContent>
          {allNews.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allNews.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-3 hover:bg-gray-50 transition-colors ${
                    highlightedNewsIds.includes(item.id) ? "bg-yellow-50 border-yellow-300" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={highlightedNewsIds.includes(item.id)}
                      onCheckedChange={() => handleToggleHighlight(item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm text-gray-900">{item.title}</h4>
                        {highlightedNewsIds.includes(item.id) && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      {item.content && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">{item.content}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {item.notice_type && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            {item.notice_type}
                          </Badge>
                        )}
                        <span className="text-[10px] text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No news or announcements available</p>
              <a
                href="/head-admin?tab=notices"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"
              >
                Create New Announcement
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {newsData && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(newsData.updated_at || Date.now()).toLocaleString()}
        </div>
      )}
    </div>
  );
}
