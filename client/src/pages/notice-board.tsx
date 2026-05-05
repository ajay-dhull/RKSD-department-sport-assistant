import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, MessageCircle, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
interface Notice {
  id: string;
  title: string;
  content: string;
  notice_type: string;
  priority: string;
  is_active: boolean;
  created_at: string;
  departments?: { name: string };
}

interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  event_date?: string;
  location?: string;
  youtube_url?: string;
  instagram_url?: string;
  formatted_message?: string;
  is_active: boolean;
  departments?: { name: string };
}

export default function NoticeBoard() {
  const [, setLocation] = useLocation();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // Fetch initial data
  const { data: noticesData } = useQuery({
    queryKey: ['/api/public/notices'],
    queryFn: async () => {
      const res = await fetch('/api/public/notices');
      if (!res.ok) throw new Error('Failed to fetch notices');
      return res.json();
    },
  });

  const { data: eventsData } = useQuery({
    queryKey: ['/api/public/events'],
    queryFn: async () => {
      const res = await fetch('/api/public/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      return res.json();
    },
  });

  useEffect(() => {
    if (noticesData?.notices) {
      setNotices(noticesData.notices);
    }
  }, [noticesData]);

  useEffect(() => {
    if (eventsData?.events) {
      setEvents(eventsData.events);
    }
  }, [eventsData]);

  // Real-time subscriptions
  useEffect(() => {
    const noticesChannel = supabase
      .channel('public:notices')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notices' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotices(prev => [payload.new as Notice, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setNotices(prev => prev.filter(n => n.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setNotices(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notice : n));
          }
        }
      )
      .subscribe();

    const eventsChannel = supabase
      .channel('public:events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEvents(prev => [payload.new as Event, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setEvents(prev => prev.map(e => e.id === payload.new.id ? payload.new as Event : e));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(noticesChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Digital Notice Board</h1>
            <p className="text-xs sm:text-sm text-gray-600">R.K.S.D. (PG) College, Kaithal</p>
          </div>
          <Button onClick={() => setLocation('/')} className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Ask Assistant
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Latest Notices
              </h2>
              <div className="space-y-4">
                {notices.map((notice) => (
                  <Card key={notice.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{notice.title}</CardTitle>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={getPriorityColor(notice.priority)}>
                              {notice.priority}
                            </Badge>
                            <Badge variant="outline">{notice.notice_type}</Badge>
                            {notice.departments && (
                              <Badge className="bg-purple-100 text-purple-700">
                                {notice.departments.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{notice.content}</p>
                      <p className="text-xs text-gray-500 mt-3">
                        Posted: {new Date(notice.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {notices.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                      No active notices at the moment
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {events.map((event) => {
                  const youtubeEmbedUrl = event.youtube_url ? getYouTubeEmbedUrl(event.youtube_url) : null;
                  
                  return (
                    <Card key={event.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-base">{event.title}</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">{event.event_type}</Badge>
                          {event.departments && (
                            <Badge className="bg-purple-100 text-purple-700">
                              {event.departments.name}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {event.formatted_message && (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.formatted_message}</p>
                        )}
                        {event.description && !event.formatted_message && (
                          <p className="text-sm text-gray-700">{event.description}</p>
                        )}
                        {youtubeEmbedUrl && (
                          <div className="my-3 rounded-lg overflow-hidden">
                            <iframe
                              width="100%"
                              height="250"
                              src={youtubeEmbedUrl}
                              title={event.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full"
                            ></iframe>
                          </div>
                        )}
                        {event.event_date && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.event_date).toLocaleDateString()} at{' '}
                            {new Date(event.event_date).toLocaleTimeString()}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                        {event.instagram_url && (
                          <a
                            href={event.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-pink-600 hover:underline inline-block"
                          >
                            View on Instagram →
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {events.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-gray-500 text-sm">
                      No upcoming events
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
              <CardHeader>
                <CardTitle className="text-white">Need Help?</CardTitle>
                <CardDescription className="text-blue-100">
                  Ask our AI assistant about college information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setLocation('/')}
                  className="w-full bg-white text-blue-600 hover:bg-blue-50"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Talk to Assistant
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
