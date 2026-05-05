import { ChatMessage } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, User, Play, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onPlayMessage: (text: string) => void;
  currentlySpeaking: boolean;
}

export function ChatContainer({ messages, isLoading, onPlayMessage, currentlySpeaking }: ChatContainerProps) {
  const formatTime = (timestamp: Date | string | null) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessage = (message: string) => {
    const lines = message.split('\n');
    
    return lines.map((line, index) => {
      // Handle horizontal rules
      if (line.trim() === '---') {
        return <hr key={index} className="my-3 border-gray-200" />;
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

  return (
    <Card className="mb-6">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
        <p className="text-sm text-gray-600">Ask me about college information, events, contacts, and more</p>
      </div>
      
      <div className="h-[500px] overflow-y-auto p-4 space-y-0">
        {/* Welcome Message */}
        {messages.length === 0 && !isLoading && (
          <div className="flex items-start space-x-3 mb-6 animate-slide-in-message">
            <div className="w-8 h-8 bg-rksd-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1 animate-bounce-in">
              <Bot className="text-white" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg px-4 py-3 animate-fade-in-up">
                <div className="text-sm text-gray-900 leading-relaxed animate-typewriter">
                  Hello! I'm your RKSD College assistant. Ask me about admissions, departments, events, 
                  hostel timings, or any other college information. You can speak or type your questions.
                </div>
              </div>
              <div className="flex items-center mt-3 space-x-3">
                <span className="text-xs text-gray-500">Just now</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-rksd-blue transition-colors p-1 h-auto"
                  onClick={() => onPlayMessage("Hello! I'm your RKSD College assistant. Ask me about admissions, departments, events, hostel timings, or any other college information. You can speak or type your questions.")}
                >
                  <Play size={12} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.map((message) => (
          <div key={message.id} className="mb-6">
            {message.role === "user" ? (
              /* User message - small bubble aligned right */
              <div className="flex justify-end">
                <div className="flex items-end space-x-2 max-w-xs">
                  <div className="bg-rksd-blue rounded-2xl rounded-br-md px-4 py-2">
                    <p className="text-sm text-white">{message.content}</p>
                  </div>
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="text-gray-600" size={12} />
                  </div>
                </div>
              </div>
            ) : (
              /* Assistant message - full-width, left-aligned */
              <div className="flex items-start space-x-3 animate-slide-in-message">
                <div className="w-8 h-8 bg-rksd-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1 animate-bounce-in">
                  <Bot className="text-white" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg px-4 py-3 animate-fade-in-up">
                    <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap animate-typewriter">
                      {formatMessage(message.content)}
                    </div>
                  </div>
                  <div className="flex items-center mt-3 space-x-3">
                    <span className="text-xs text-gray-500">
                      {formatTime(message.timestamp)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-rksd-blue transition-colors p-1 h-auto"
                      onClick={() => onPlayMessage(message.content)}
                    >
                      <Play size={12} />
                    </Button>
                    {currentlySpeaking && (
                      <span className="text-xs text-green-600 flex items-center">
                        <Volume2 className="mr-1" size={12} />
                        Playing
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3 mb-6">
            <div className="w-8 h-8 bg-rksd-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="text-white" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-transparent px-0 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-rksd-blue rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-rksd-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-rksd-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
