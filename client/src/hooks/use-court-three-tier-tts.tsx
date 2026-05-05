import { useState, useCallback } from "react";

interface TTSOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  cartesiaModelId?: string;
  speed?: "slowest" | "slow" | "normal" | "fast" | "fastest" | number;
  emotions?: string[];
  language?: "en" | "fr" | "de" | "es" | "pt" | "zh" | "ja" | "hi" | "it" | "ko" | "nl" | "pl" | "ru" | "sv" | "tr";
}

interface UseCourtThreeTierTTSReturn {
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
}

export function useCourtThreeTierTTS(): UseCourtThreeTierTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const VOICES = {
    hindi: "iWNf11sz1GrUE4ppxTOL",
    english: "iWNf11sz1GrUE4ppxTOL",
  };

  const speak = useCallback(async (text: string, options: TTSOptions = {}) => {
    console.log('Court TTS: Starting three-tier speech for:', text.substring(0, 50));

    try {
      setIsLoading(true);

      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      try {
        const voiceId = options.voiceId || VOICES.hindi;

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/court/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            voiceId: voiceId,
            modelId: options.modelId || "eleven_multilingual_v2",
            stability: options.stability || 0.6,
            similarityBoost: options.similarityBoost || 0.8,
            cartesiaModelId: options.cartesiaModelId || "sonic-2",
            speed: options.speed || "slow",
            emotions: options.emotions,
            language: options.language || "hi"
          })
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          const provider = response.headers.get('X-TTS-Provider') || 'unknown';

          setCurrentAudio(audio);
          setIsLoading(false);
          setIsSpeaking(true);

          console.log(`Court TTS: ${provider} audio ready, playing...`);

          audio.onplay = () => {
            console.log(`Court TTS: ${provider} audio started playing`);
            options.onStart?.();
          };

          audio.onended = () => {
            setIsSpeaking(false);
            setCurrentAudio(null);
            URL.revokeObjectURL(audioUrl);
            console.log(`Court TTS: ${provider} audio finished`);
            options.onEnd?.();
          };

          audio.onerror = () => {
            setIsSpeaking(false);
            setIsLoading(false);
            setCurrentAudio(null);
            URL.revokeObjectURL(audioUrl);
            console.error('Court TTS: Audio playback failed');
            options.onError?.("Audio playback failed");
          };

          await audio.play();
          return;
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          if (errorData.fallbackToBrowser) {
            console.log('Court TTS: API providers unavailable, using browser fallback');
          } else {
            throw new Error(errorData.message || `HTTP ${response.status}`);
          }
        }
      } catch (apiError) {
        console.warn('Court TTS: API providers failed, falling back to Web Speech API:', apiError instanceof Error ? apiError.message : 'Unknown error');
      }

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.2;
        utterance.volume = 1.0;
        utterance.lang = 'hi-IN';

        const voices = speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice =>
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('karen')
        );

        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        setIsLoading(false);
        setIsSpeaking(true);

        utterance.onstart = () => {
          console.log('Court TTS: Web Speech API started speaking');
          options.onStart?.();
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          options.onEnd?.();
        };

        utterance.onerror = (event) => {
          setIsSpeaking(false);
          setIsLoading(false);
          options.onError?.(`Speech failed: ${event.error}`);
        };

        speechSynthesis.speak(utterance);
        return;
      }

      throw new Error('No speech synthesis available');

    } catch (error) {
      setIsSpeaking(false);
      setIsLoading(false);
      setCurrentAudio(null);
      console.error('Court TTS: All methods failed:', error);
      options.onError?.(error instanceof Error ? error.message : "Speech synthesis failed");
    }
  }, [currentAudio]);

  const stop = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, [currentAudio]);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
  };
}
