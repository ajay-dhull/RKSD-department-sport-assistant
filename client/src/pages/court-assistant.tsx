import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useVoice } from "@/hooks/use-voice";
import { useCourtThreeTierTTS } from "@/hooks/use-court-three-tier-tts";
import { WaveformAnimation } from "@/components/WaveformAnimation";
import { Button } from "@/components/ui/button";
import { 
  Scale, 
  Mic, 
  Play, 
  Building2, 
  FileText, 
  Users, 
  MapPin,
  Send,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// API request helper
async function apiRequest(method: string, url: string, data?: any) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const apiUrl = `${import.meta.env.VITE_API_BASE_URL || ''}${url}`;
  const response = await fetch(apiUrl, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response;
}

// Format message to render emojis and basic markdown
const formatMessage = (message: string) => {
  const lines = message.split('\n');

  return lines.map((line, index) => {
    // Handle table headers and rows
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

    // Handle regular table rows
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

    // Handle section headers with emojis
    if (line.includes('⚖️') || line.includes('📌') || line.includes('⏰') || line.includes('📞')) {
      return (
        <div key={index} className="font-semibold text-gray-900 my-2">
          {line}
        </div>
      );
    }

    // Handle horizontal rules
    if (line.trim() === '---') {
      return <hr key={index} className="my-2 border-gray-200" />;
    }

    // Regular lines with emojis preserved
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

export default function CourtAssistant() {
  const [showListening, setShowListening] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'user' | 'assistant',
    message: string,
    id: string,
    buildingImages?: Array<{
      id: string;
      title: string;
      description?: string;
      image_url: string;
      room_number?: string;
      building_name?: string;
    }>
  }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isPreparingSpeech, setIsPreparingSpeech] = useState(false);
  const [pendingAssistantMessage, setPendingAssistantMessage] = useState<{id: string, text: string} | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [modalImage, setModalImage] = useState<{url: string, title: string} | null>(null);
  const requestIdRef = useRef(0);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Voice input
  const {
    isListening,
    startListening,
    stopListening,
    transcript,
    browserSupported,
    resetTranscript,
  } = useVoice();

  // Three-tier TTS (OpenAI -> Cartesia -> Browser)
  const { speak, stop: stopSpeaking, isSpeaking, isLoading: isTTSLoading } = useCourtThreeTierTTS();

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; sessionId?: string }) => {
      setIsTyping(true);
      const response = await apiRequest("POST", "/api/court/ask", data);
      return response.json();
    },
    onSuccess: async (data) => {
      setShowListening(false);
      setIsTyping(false);
      
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
      
      if (data.response) {
        const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const currentRequestId = ++requestIdRef.current;

        // Keep typing animation and prepare speech first
        setIsPreparingSpeech(true);
        setPendingAssistantMessage({id: assistantMessageId, text: data.response});

        // Start preparing speech with onStart callback for precise sync
        speak(data.response, {
          onStart: () => {
            if (currentRequestId === requestIdRef.current) {
              // Voice started, now show text synchronized with audio
              setChatHistory(prev => [...prev, {
                type: 'assistant', 
                message: data.response, 
                id: assistantMessageId,
                buildingImages: data.buildingImages
              }]);
              setIsPreparingSpeech(false);
              setPendingAssistantMessage(null);
            }
          },
          onEnd: () => {
            console.log('Court speech completed');
          },
          onError: (error) => {
            console.error('Court speech failed:', error);
            if (currentRequestId === requestIdRef.current) {
              // On error, show text immediately
              setChatHistory(prev => [...prev, {
                type: 'assistant', 
                message: data.response, 
                id: assistantMessageId,
                buildingImages: data.buildingImages
              }]);
              setIsPreparingSpeech(false);
              setPendingAssistantMessage(null);
              toast({
                title: "Voice playback unavailable",
                description: "Using fallback speech system",
                variant: "default",
              });
            }
          }
        });
      }
    },
    onError: (error) => {
      console.error("Court query error:", error);
      setIsTyping(false);
      setShowListening(false);
      setIsPreparingSpeech(false);
      setPendingAssistantMessage(null);
      toast({
        title: "Error",
        description: "Failed to process your question. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send message function
  const sendMessage = useCallback((message: string) => {
    if (!message.trim()) return;

    console.log(`Court: Sending message: "${message}"`);
    setChatStarted(true);

    // Add user message to chat
    const userMessageId = `user-${Date.now()}`;
    setChatHistory(prev => [...prev, {type: 'user', message, id: userMessageId}]);

    // Send to API
    sendMessageMutation.mutate({ 
      message,
      sessionId
    });

    // Reset input
    setTextInput("");
    resetTranscript();
  }, [sendMessageMutation, sessionId, resetTranscript]);

  // Handle voice input
  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      setShowListening(true);
      toast({
        title: "Listening...",
        description: "Speak your question clearly",
      });
    }
  };

  // Handle text input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      sendMessage(textInput);
    }
  };

  // Handle replay of assistant message
  const handleSpeak = (text: string) => {
    speak(text);
  };

  // When transcript changes and listening stops, send message
  useEffect(() => {
    if (!isListening && transcript && transcript.trim().length > 0) {
      sendMessage(transcript);
    }
  }, [transcript, isListening, sendMessage]);

  // Update live transcript while listening
  useEffect(() => {
    if (isListening) {
      setLiveTranscript(transcript);
    }
  }, [transcript, isListening]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping, isPreparingSpeech]);

  const quickActions = [
    {
      id: "courtrooms",
      icon: Building2,
      title: "Find Courtroom",
      subtitle: "Locate courtrooms",
      query: "How do I find courtroom number 5 in Kaithal District Court?"
    },
    {
      id: "files",
      icon: FileText,
      title: "Track Files",
      subtitle: "Case file status",
      query: "Where can I track my case file and who handles it?"
    },
    {
      id: "staff",
      icon: Users,
      title: "Staff Directory",
      subtitle: "Find staff members",
      query: "How can I contact the registry office staff?"
    },
    {
      id: "directions",
      icon: MapPin,
      title: "Directions",
      subtitle: "Navigate court",
      query: "Give me directions to the judge's chambers"
    }
  ];

  return (
    <div className="w-full bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 text-gray-900 flex flex-col relative overflow-hidden"
         style={{ 
           maxWidth: '100vw', 
           height: '100vh',
           minHeight: '100vh',
           maxHeight: '100vh'
         }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-violet-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 bg-gradient-to-br from-violet-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-br from-purple-400/10 to-indigo-400/10 rounded-full blur-2xl"></div>
      </div>

      {/* Enhanced Header with Professional Branding */}
      <header className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] h-16 bg-white/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <Scale className="text-white w-5 h-5" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h1 className="font-bold text-xl text-gray-900">Kaithal District Court</h1>
            <p className="text-xs text-gray-600 font-medium">AI Legal Navigation Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
            ● Online
          </div>
        </div>
      </header>

      {/* Chat Interface - Full Screen Layout */}
      <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-5 relative z-10">
        <AnimatePresence>
          {chatStarted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Voice Assistant Animation - Always Visible */}
              <div 
                className="flex justify-center py-4 h-[100px] items-center overflow-hidden" 
                style={{ 
                  contain: 'layout style',
                  willChange: 'auto',
                  transform: 'translateZ(0)'
                }}
              >
                <div style={{ contain: 'layout', transform: 'translateZ(0)' }}>
                  <WaveformAnimation 
                    isListening={isListening} 
                    isSpeaking={isSpeaking} 
                    isActive={isListening || sendMessageMutation.isPending || isTyping || isSpeaking}
                  />
                </div>
              </div>

              {/* Chat Messages Area - Scrollable - Centered like ChatGPT */}
              <div
                ref={chatAreaRef}
                className="flex-1 overflow-y-auto pb-20 px-2 sm:px-4"
              >
                <div className="max-w-3xl mx-auto space-y-4">
                  {chatHistory.map((chat) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="w-full"
                    >
                      <div
                        className={`inline-block px-5 py-3 rounded-2xl max-w-full shadow-md
                        ${chat.type === 'user'
                          ? 'bg-purple-600 text-white rounded-tr-sm float-right clear-both'
                          : 'bg-white text-gray-900 rounded-tl-sm border border-gray-200 float-left clear-both'
                        }`}
                        style={{ maxWidth: '85%' }}
                      >
                        {chat.buildingImages && chat.buildingImages.length > 0 && (
                          <div className="mb-3 space-y-2">
                            {chat.buildingImages.map((img, imgIndex) => (
                              <div 
                                key={imgIndex} 
                                className="bg-gray-50 rounded-lg overflow-hidden shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => setModalImage({url: img.image_url, title: img.title || 'Building location'})}
                              >
                                <div className="bg-white p-1.5">
                                  <img 
                                    src={img.image_url} 
                                    alt={img.title || 'Building location'} 
                                    className="w-full h-28 sm:h-32 object-contain rounded"
                                    loading="lazy"
                                  />
                                </div>
                                {img.title && (
                                  <div className="p-2.5 sm:p-3 bg-white">
                                    <div className="font-semibold text-sm sm:text-base text-gray-900">{img.title}</div>
                                    {img.description && (
                                      <div className="text-xs sm:text-sm text-gray-700 mt-1 leading-relaxed">{img.description}</div>
                                    )}
                                    {img.room_number && (
                                      <div className="text-xs sm:text-sm text-gray-600 mt-1.5 font-medium">Room: {img.room_number}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-[15px] leading-relaxed" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}>
                          {formatMessage(chat.message)}
                        </div>

                        {/* Replay button for assistant */}
                        {chat.type === 'assistant' && (
                          <button
                            onClick={() => handleSpeak(chat.message)}
                            className="mt-2 inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors"
                          >
                            <Play size={12} />
                            <span className="text-xs font-medium">Replay</span>
                          </button>
                        )}
                      </div>
                      <div className="clear-both"></div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {(isTyping || isPreparingSpeech) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-full"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 shadow-md float-left clear-both">
                        <span className="text-sm text-gray-600">
                          {isTyping ? "Soch raha hoon..." : "Tayyar ho raha hai..."}
                        </span>
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-150"></span>
                          <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-300"></span>
                        </div>
                      </div>
                      <div className="clear-both"></div>
                    </motion.div>
                  )}

                  {/* Live transcript during listening */}
                  {liveTranscript && showListening && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="w-full"
                    >
                      <div className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200 shadow-md text-center max-w-[80%] sm:max-w-xs mx-auto">
                        <p className="text-sm text-gray-600">
                          "{liveTranscript}"
                        </p>
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
              className="flex-1 flex flex-col overflow-y-auto"
            >
              {/* Voice Assistant Animation - Always Visible */}
              <div 
                className="flex justify-center py-4 h-[100px] items-center overflow-hidden flex-shrink-0" 
                style={{ 
                  contain: 'layout style',
                  willChange: 'auto',
                  transform: 'translateZ(0)'
                }}
              >
                <div style={{ contain: 'layout', transform: 'translateZ(0)' }}>
                  <WaveformAnimation 
                    isListening={isListening} 
                    isSpeaking={isSpeaking} 
                    isActive={isListening || sendMessageMutation.isPending || isTyping || isSpeaking}
                  />
                </div>
              </div>

              {/* Enhanced Welcome Section */}
              <div className="py-4 sm:py-6 text-center flex-shrink-0">
                <div className="mb-3 sm:mb-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-sm rounded-full border border-white/20 shadow-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-900">AI Assistant Ready</span>
                  </div>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 px-4">
                  <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                    Welcome to Kaithal Court AI
                  </span>
                  <span className="ml-2">⚖️</span>
                </h1>
                <p className="text-gray-700 text-base sm:text-lg font-medium px-4">
                  How can I assist you today?
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 opacity-80 px-4">
                  Ask me about courtrooms, case files, staff, or directions
                </p>
              </div>

              {/* Quick Actions Grid - Mobile Responsive with proper spacing */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 max-w-lg mx-auto w-full px-3 sm:px-2 pb-24 sm:pb-28 md:pb-32">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => {
                      sendMessage(action.query);
                    }}
                    className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-200 active:scale-95"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <action.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">{action.title}</h3>
                      <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 leading-tight">{action.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Input Bar - Fixed with safe area support */}
      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:pt-3 bg-gradient-to-t from-purple-50/90 to-transparent backdrop-blur-sm flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your question..."
              className="w-full px-4 py-2.5 sm:py-3 pr-12 rounded-full bg-white border border-gray-200 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
              disabled={sendMessageMutation.isPending || isTyping}
            />
          </div>
          
          <Button
            type="button"
            onClick={handleVoiceToggle}
            size="icon"
            className={`rounded-full w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 transition-all duration-200 shadow-md ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-gradient-to-br from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600'
            }`}
            disabled={!browserSupported || sendMessageMutation.isPending}
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </Button>

          <Button
            type="submit"
            size="icon"
            className="rounded-full w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 bg-gradient-to-br from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-md"
            disabled={!textInput.trim() || sendMessageMutation.isPending || isTyping}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </Button>
        </form>
      </div>

      {/* Full-Screen Image Modal */}
      <AnimatePresence>
        {modalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-6xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setModalImage(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              <div className="p-4 sm:p-6">
                <img
                  src={modalImage.url}
                  alt={modalImage.title}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              </div>
              
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 bg-gradient-to-t from-gray-50 to-transparent">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 text-center">
                  {modalImage.title}
                </h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
