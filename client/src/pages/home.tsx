import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useVoice } from "@/hooks/use-voice";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  Send,
  Mic,
  Trophy,
  BookOpen,
  Megaphone
} from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

const formatMessage = (message: string) => {
  const lines = message.split('\n');

  return lines.map((line, index) => {
    if (line.includes('|') && line.includes('-')) {
      return (
        <div key={index} className="my-2 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr className="border-b">
                {line.split('|').filter(cell => cell.trim()).map((cell, cellIndex) => (
                  <td key={cellIndex} className="p-1 border-r last:border-r-0 font-medium">
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (line.includes('|') && !line.includes('-')) {
      return (
        <div key={index} className="my-1 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <tbody>
              <tr>
                {line.split('|').filter(cell => cell.trim()).map((cell, cellIndex) => (
                  <td key={cellIndex} className="p-1 border-r last:border-r-0">
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (line.includes('🎓') || line.includes('📌') || line.includes('⏰') || line.includes('📞') || line.includes('🏃') || line.includes('🏆')) {
      return (
        <div key={index} className="font-semibold text-[var(--slate-text)] my-2">
          {line}
        </div>
      );
    }

    if (line.trim() === '---') {
      return <hr key={index} className="my-2 border-gray-200" />;
    }

    if (line.trim()) {
      return (
        <div key={index} className="my-1">
          {line}
        </div>
      );
    }

    return <br key={index} />;
  });
};

export default function Home() {
  const [, setLocation] = useLocation();
  const [textInput, setTextInput] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'assistant', message: string, id: string}>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(() => {
    return localStorage.getItem('chat_session_id') || undefined;
  });
  const [showListening, setShowListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const {
    isListening,
    startListening,
    stopListening,
    transcript,
    browserSupported,
    resetTranscript,
  } = useVoice();

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; language?: string; sessionId?: string; recentHistory?: Array<{role: string; content: string}> }) => {
      setIsTyping(true);
      const response = await apiRequest("POST", "/api/ask", data);
      return response.json();
    },
    onSuccess: (data) => {
      setShowListening(false);
      setIsTyping(false);

      if (data.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('chat_session_id', data.sessionId);
      }

      if (data.response) {
        const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setChatHistory(prev => [...prev, { type: 'assistant', message: data.response, id: assistantMessageId }]);
      }
    },
    onError: (error: any) => {
      console.error("Send message error:", error);
      setShowListening(false);
      setIsTyping(false);
      toast({
        title: "Connection Error",
        description: error?.message || "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    },
  });

  const sendMessage = useCallback((message: string) => {
    if (!message.trim() || sendMessageMutation.isPending) return;

    setChatStarted(true);
    const userMessageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setChatHistory(prev => [...prev, { type: 'user', message: message.trim(), id: userMessageId }]);

    // Send last 10 messages as fallback context (in case server session is lost)
    const recentHistory = chatHistory.slice(-10).map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.message,
    }));

    sendMessageMutation.mutate({
      message: message.trim(),
      language: "en",
      sessionId: sessionId,
      recentHistory,
    });

    setTextInput("");
    resetTranscript();
  }, [sendMessageMutation, resetTranscript, sessionId]);

  const handleMicClick = useCallback(() => {
    if (!browserSupported) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      stopListening();
      setShowListening(false);
    } else {
      setChatStarted(true);
      setShowListening(true);
      resetTranscript();
      startListening();
    }
  }, [browserSupported, isListening, startListening, stopListening, resetTranscript, toast]);

  const handleSendText = useCallback(() => {
    const message = textInput.trim();
    if (message) {
      sendMessage(message);
    }
  }, [textInput, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  }, [handleSendText]);

  useEffect(() => {
    if (transcript && !isListening) {
      sendMessage(transcript);
    }
  }, [transcript, isListening, sendMessage]);

  useEffect(() => {
    if (isListening) {
      setLiveTranscript(transcript);
    }
  }, [transcript, isListening]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const quickActions = [
    {
      id: "courses",
      icon: BookOpen,
      title: "Courses",
      subtitle: "B.P.Ed, M.P.Ed programs",
      query: "What courses are offered in the Physical Education department at RKSD College?"
    },
    {
      id: "timetable",
      icon: Clock,
      title: "Timetable",
      subtitle: "Class schedule",
      query: "Show me the timetable for Physical Education department"
    },
    {
      id: "faculty",
      icon: Users,
      title: "Faculty",
      subtitle: "Department staff",
      query: "Tell me about the faculty in the Physical Education department at RKSD College"
    },
    {
      id: "sports",
      icon: Trophy,
      title: "Sports & Activities",
      subtitle: "Achievements & events",
      query: "What sports facilities and achievements does RKSD Physical Education department have?"
    }
  ];

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50 text-[var(--slate-text)] flex flex-col relative overflow-hidden"
         style={{ 
           maxWidth: '100vw', 
           height: '100vh',
           minHeight: '100vh',
           maxHeight: '100vh'
         }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-[var(--rksd-blue)]/10 to-green-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-gradient-to-br from-green-400/10 to-teal-400/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-br from-[var(--rksd-light)]/10 to-blue-400/10 rounded-full blur-2xl"></div>
      </div>

      <header className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] h-16 bg-white/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-white shadow-lg border border-gray-100 flex items-center justify-center overflow-hidden">
              <img src="/rksd-logo.webp" alt="RKSD College" className="w-9 h-9 object-contain" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h1 className="font-bold text-base text-[var(--slate-text)] leading-tight">RKSD College</h1>
            <p className="text-xs text-[var(--slate-muted)] font-medium">Physical Education Department</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocation("/updates")}
            className="relative flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-full hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <Megaphone size={12} /> Updates
          </button>
          <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
            ● Online
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-5 md:px-8 lg:px-10 relative z-10">
        <AnimatePresence>
          {chatStarted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div
                ref={chatAreaRef}
                className="flex-1 overflow-y-auto pb-24 pt-4 px-2 sm:px-4 md:px-6 lg:px-8"
              >
                <div className="max-w-3xl mx-auto space-y-4">
                  {chatHistory.map((chat) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="w-full"
                    >
                      <div
                        className={`inline-block px-4 md:px-5 py-3 rounded-2xl max-w-full shadow-sm
                        ${chat.type === 'user'
                          ? 'bg-[var(--teal-primary)] text-white rounded-tr-sm float-right clear-both'
                          : 'bg-white text-[var(--slate-text)] rounded-tl-sm border border-gray-200 float-left clear-both'
                        }`}
                        style={{ maxWidth: window.innerWidth < 768 ? '85%' : '75%' }}
                      >
                        <div className="text-[15px] leading-relaxed" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}>
                          {formatMessage(chat.message)}
                        </div>
                      </div>
                      <div className="clear-both"></div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 shadow-sm float-left clear-both">
                        <span className="text-sm text-[var(--slate-muted)]">Assistant thinking...</span>
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-[var(--teal-primary)] rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-[var(--teal-primary)] rounded-full animate-bounce delay-150"></span>
                          <span className="w-2 h-2 bg-[var(--teal-primary)] rounded-full animate-bounce delay-300"></span>
                        </div>
                      </div>
                      <div className="clear-both"></div>
                    </motion.div>
                  )}

                  {liveTranscript && showListening && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="w-full"
                    >
                      <div className="p-3 text-center max-w-[80%] sm:max-w-xs mx-auto bg-white border border-gray-200 rounded-xl shadow-sm">
                        <p className="text-sm text-[var(--slate-muted)] italic">"{liveTranscript}"</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              <div className="py-8 text-center">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-sm rounded-full border border-white/20 shadow-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-[var(--slate-text)]">AI Assistant Ready</span>
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-[var(--rksd-blue)] to-green-500 bg-clip-text text-transparent">
                    Hello!
                  </span>
                  <span className="ml-2 text-2xl sm:text-3xl not-italic" style={{fontFamily: 'sans-serif'}}>👋</span>
                </h1>
                <p className="text-[var(--slate-muted)] text-lg font-medium">
                  Physical Education Department Assistant
                </p>
                <p className="text-sm text-[var(--slate-muted)] mt-1 opacity-80">
                  Ask me anything about the Physical Dept. — in Hindi or English
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2 pb-28">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => sendMessage(action.query)}
                      className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl p-4 text-left hover:bg-white hover:shadow-md transition-all group"
                    >
                      <div className="w-9 h-9 bg-gradient-to-br from-[var(--rksd-blue)] to-green-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Icon size={18} className="text-white" />
                      </div>
                      <p className="font-semibold text-[var(--slate-text)] text-sm">{action.title}</p>
                      <p className="text-xs text-[var(--slate-muted)] mt-0.5">{action.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-3 py-2 z-20"
        style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 8px))' }}
      >
        <div className="flex items-center gap-2 bg-white shadow-sm rounded-full p-2 border border-gray-200 max-w-3xl mx-auto">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            disabled={sendMessageMutation.isPending}
            className="flex-1 bg-transparent px-3 py-2 outline-none placeholder-gray-400 text-gray-800 text-sm disabled:opacity-50"
          />

          {textInput.trim() ? (
            <button
              onClick={handleSendText}
              disabled={sendMessageMutation.isPending}
              className="h-10 w-10 rounded-full flex items-center justify-center transition-all bg-gradient-to-r from-[var(--rksd-blue)] to-green-500 hover:opacity-90 disabled:opacity-50"
            >
              <Send size={16} className="text-white" />
            </button>
          ) : (
            <button
              onClick={handleMicClick}
              disabled={!browserSupported || sendMessageMutation.isPending}
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gradient-to-r from-[var(--rksd-blue)] to-green-500 hover:opacity-90"
              } disabled:opacity-50`}
            >
              <Mic size={16} className="text-white" />
            </button>
          )}
        </div>

        {isListening && (
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-red-500 font-medium">Listening... tap mic to stop</span>
          </div>
        )}
      </div>
    </div>
  );
}
