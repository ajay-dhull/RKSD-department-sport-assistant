import { useState, useCallback, useRef } from "react";

interface SpeechOptions {
  onEnd?: () => void;
  onError?: (error: string) => void;
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface UseSpeechReturn {
  speak: (text: string, options?: SpeechOptions) => void;
  stop: () => void;
  isSpeaking: boolean;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
}

export function useSpeech(): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load available voices
  const loadVoices = useCallback(() => {
    if (!supported) return;
    
    const availableVoices = speechSynthesis.getVoices();
    setVoices(availableVoices);
  }, [supported]);

  // Initialize voices on component mount
  useState(() => {
    if (supported) {
      loadVoices();
      speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  });

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!supported || !text.trim()) return;

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Detect language and set appropriate voice
    const isHindi = /[\u0900-\u097F]/.test(text);
    const preferredVoices = voices.filter(voice => 
      isHindi 
        ? voice.lang.includes('hi') || voice.lang.includes('Hindi')
        : voice.lang.includes('en')
    );

    if (preferredVoices.length > 0) {
      utterance.voice = options.voice || preferredVoices[0];
    }

    // Set speech parameters
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.lang = isHindi ? 'hi-IN' : 'en-US';

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      options.onError?.(event.error);
    };

    // Speak
    speechSynthesis.speak(utterance);
  }, [supported, voices]);

  const stop = useCallback(() => {
    if (!supported) return;
    
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  return {
    speak,
    stop,
    isSpeaking,
    supported,
    voices,
  };
}
