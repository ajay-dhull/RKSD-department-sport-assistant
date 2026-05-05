import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Square } from "lucide-react";

interface VoiceControlsProps {
  isSpeaking: boolean;
  onToggleSpeak: () => void;
  ttsSupported: boolean;
}

export function VoiceControls({ isSpeaking, onToggleSpeak, ttsSupported }: VoiceControlsProps) {
  return (
    <div className="mb-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-rksd-light rounded-full flex items-center justify-center">
              <Volume2 className="text-white" size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isSpeaking ? "Speaking Response" : "Voice Assistant Ready"}
              </p>
              <p className="text-xs text-gray-500">
                {ttsSupported ? "Hindi & English supported" : "Text-to-speech not supported"}
              </p>
            </div>
          </div>
          <Button
            onClick={onToggleSpeak}
            disabled={!ttsSupported}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm ${
              isSpeaking
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-rksd-blue hover:bg-blue-700 text-white"
            }`}
          >
            {isSpeaking ? (
              <>
                <Square className="mr-2" size={16} />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="mr-2" size={16} />
                <span>Speak</span>
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
