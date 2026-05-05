import { useState, useEffect, useRef } from 'react';

interface UseWebRTCAudioSessionReturn {
  currentVolume: number;
  isSessionActive: boolean;
  handleStartStopClick: () => void;
}

const useWebRTCAudioSession = (voice: string = 'alloy'): UseWebRTCAudioSessionReturn => {
  const [currentVolume, setCurrentVolume] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const handleStartStopClick = () => {
    if (isSessionActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      setIsSessionActive(true);
      analyzeAudio();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopSession = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsSessionActive(false);
    setCurrentVolume(0);
  };

  const analyzeAudio = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateVolume = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Normalize to 0-1 range and smooth it
      const normalizedVolume = average / 255;
      setCurrentVolume(normalizedVolume);
      
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };
    
    updateVolume();
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return {
    currentVolume,
    isSessionActive,
    handleStartStopClick,
  };
};

export default useWebRTCAudioSession;