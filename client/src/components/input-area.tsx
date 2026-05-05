import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mic, 
  MicOff, 
  Send, 
  Clock, 
  Phone, 
  Calendar, 
  Building 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  onToggleVoice: () => void;
  onQuickQuery: (query: string) => void;
  isListening: boolean;
  transcript: string;
  isProcessing: boolean;
  voiceSupported: boolean;
}

export function InputArea({
  onSendMessage,
  onToggleVoice,
  onQuickQuery,
  isListening,
  transcript,
  isProcessing,
  voiceSupported
}: InputAreaProps) {
  const [textInput, setTextInput] = useState("");

  const handleSendText = () => {
    const message = textInput.trim() || transcript.trim();
    if (message) {
      onSendMessage(message);
      setTextInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const quickQueries = [
    { icon: Clock, text: "College Timings", query: "College ka timing kya hai?" },
    { icon: Phone, text: "Contact Info", query: "College ka contact number kya hai?" },
    { icon: Calendar, text: "Events", query: "Upcoming events kya hai college me?" },
    { icon: Building, text: "Departments", query: "College me kya departments hai?" },
  ];

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Voice Input Section */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[var(--rksd-blue)] to-[var(--rksd-light)] rounded-full flex items-center justify-center relative">
              <Mic className="text-white" size={20} />
              {isListening && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isListening ? "Listening..." : transcript ? "Voice detected" : "Ready to listen"}
              </p>
              <p className="text-xs text-gray-500">
                {voiceSupported 
                  ? "Click microphone and speak your question"
                  : "Voice input not supported in this browser"
                }
              </p>
            </div>
          </div>
          <Button
            onClick={onToggleVoice}
            disabled={!voiceSupported}
            className={cn(
              "inline-flex items-center px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm",
              isListening
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gradient-to-r from-[var(--rksd-blue)] to-[var(--rksd-light)] hover:from-[var(--rksd-light)] hover:to-[var(--rksd-blue)] text-white"
            )}
          >
            {isListening ? (
              <>
                <MicOff className="mr-2" size={16} />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="mr-2" size={16} />
                <span>Start Listening</span>
              </>
            )}
          </Button>
        </div>

        {/* Show transcript if available */}
        {transcript && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Voice input:</strong> {transcript}
            </p>
          </div>
        )}

        {/* Text Input Section */}
        <div className="relative">
          <Textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-rksd-blue focus:border-rksd-blue transition-colors text-sm"
            placeholder="Type your question here... (Hindi और English both supported)"
            rows={3}
            disabled={isProcessing}
          />
          <Button
            onClick={handleSendText}
            disabled={isProcessing || (!textInput.trim() && !transcript.trim())}
            className="absolute bottom-3 right-3 w-8 h-8 bg-rksd-blue hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 p-0"
          >
            <Send size={16} />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {quickQueries.map(({ icon: Icon, text, query }) => (
            <Button
              key={text}
              variant="secondary"
              size="sm"
              onClick={() => onQuickQuery(query)}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
            >
              <Icon className="mr-1.5" size={12} />
              {text}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
