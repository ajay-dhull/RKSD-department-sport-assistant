import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface WaveformAnimationProps {
  isListening: boolean;
  audioLevel?: number;
  isSpeaking?: boolean;
  isActive?: boolean;
}

export function WaveformAnimation({ isListening, audioLevel = 0.5, isSpeaking = false, isActive = true }: WaveformAnimationProps) {
  const [bars] = useState(() => Array.from({ length: 4 }, (_, i) => i));
  const [animationTime, setAnimationTime] = useState(0);

  // Update animation time for smooth animations using RAF
  useEffect(() => {
    if (!isListening && !isSpeaking) return;
    
    let animationId: number;
    const updateTime = () => {
      setAnimationTime(Date.now());
      animationId = requestAnimationFrame(updateTime);
    };
    
    animationId = requestAnimationFrame(updateTime);
    
    return () => cancelAnimationFrame(animationId);
  }, [isListening, isSpeaking]);

  const getBarHeight = (index: number) => {
    if (!isListening && !isSpeaking) return 32;
    
    // Create unique timing for each bar with different frequencies and phases
    const baseHeight = 32;
    const maxHeight = isSpeaking ? 90 : 70;
    
    // More dramatic movement with different frequencies and phases for each bar
    const frequencies = [0.015, 0.022, 0.028, 0.018]; // Faster speeds for more movement
    const phases = [0, 2.1, 4.2, 1.4]; // Different starting points
    const amplitudes = [0.8, 1.0, 0.9, 1.1]; // Higher intensities for more movement
    
    const frequency = frequencies[index % frequencies.length];
    const phase = phases[index % phases.length];
    const amplitude = amplitudes[index % amplitudes.length];
    
    // Add secondary wave for more natural voice-like movement
    const primaryWave = Math.sin(animationTime * frequency + phase) * amplitude;
    const secondaryWave = Math.sin(animationTime * frequency * 1.3 + phase * 0.7) * 0.3;
    const variation = (primaryWave + secondaryWave) * 0.5 + 0.7;
    
    return baseHeight + (maxHeight - baseHeight) * audioLevel * Math.max(0.3, variation);
  };

  const barVariants = {
    idle: (index: number) => ({
      height: 32,
      backgroundColor: "hsl(220 8% 65%)", // Soft gray
      transition: { 
        duration: 0.5,
        type: "spring",
        damping: 20,
        stiffness: 100
      }
    }),
    listening: (index: number) => ({
      height: getBarHeight(index),
      backgroundColor: "hsl(210 60% 70%)", // Gentle blue
      transition: {
        height: {
          duration: 0.2,
          ease: "easeInOut",
          type: "tween"
        }
      }
    }),
    speaking: (index: number) => ({
      height: getBarHeight(index),
      backgroundColor: "hsl(210 45% 60%)", // Professional blue-gray
      transition: {
        height: {
          duration: 0.08 + (index * 0.015), // Faster, more responsive timing
          ease: "easeOut",
          type: "tween"
        }
      }
    })
  };

  const getAnimationState = () => {
    if (isSpeaking) return "speaking";
    if (isListening) return "listening";
    return "idle";
  };

  return (
    <div 
      className={`flex items-center justify-center space-x-2 transition-opacity duration-300 ${
        isActive ? 'opacity-100' : 'opacity-30'
      }`}
      style={{ 
        willChange: 'auto',
        contain: 'layout',
        transform: 'translateZ(0)',
        height: '80px',
        display: 'flex',
        alignItems: 'center'
      }}
      data-testid="waveform-animation"
    >
      {bars.map((index) => (
        <motion.div
          key={index}
          custom={index}
          variants={barVariants}
          animate={getAnimationState()}
          className="w-4 rounded-full"
          style={{
            minHeight: 32,
            maxHeight: 80, // Prevent bars from growing beyond container
            filter: "drop-shadow(0 4px 12px rgba(71, 85, 105, 0.25)) drop-shadow(0 0 8px rgba(71, 85, 105, 0.15))",
            willChange: 'height',
            transform: 'translateZ(0)',
            contain: 'layout'
          }}
        />
      ))}
    </div>
  );
}