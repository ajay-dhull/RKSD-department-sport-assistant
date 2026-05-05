import { useState, useEffect } from "react";

interface AnimatedFaceProps {
  state: 'idle' | 'listening' | 'speaking' | 'typing';
  size?: number;
  emotion?: 'neutral' | 'happy' | 'worried' | 'thinking';
}

export function AnimatedFace({ state, size = 120, emotion = 'neutral' }: AnimatedFaceProps) {
  const [expression, setExpression] = useState(emotion);
  const [eyeBlink, setEyeBlink] = useState(false);
  const [mouthAnimation, setMouthAnimation] = useState(false);

  // Update expression when emotion prop changes
  useEffect(() => {
    setExpression(emotion);
  }, [emotion]);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // State-based animations
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state === 'listening') {
      setExpression('thinking');
    } else if (state === 'speaking') {
      setExpression('happy');
      interval = setInterval(() => {
        setMouthAnimation(prev => !prev);
      }, 200);
    } else if (state === 'typing') {
      setExpression('thinking');
    } else {
      setExpression(emotion);
    }

    return () => {
      if (interval) clearInterval(interval);
      setMouthAnimation(false);
    };
  }, [state, emotion]);

  // Expression-based features
  const getEyeShape = () => {
    if (eyeBlink) return { scaleY: 0.1 };
    
    switch (expression) {
      case 'happy':
        return { scaleY: 0.8, transform: 'rotate(-10deg)' };
      case 'worried':
        return { scaleY: 1.2, transform: 'rotate(15deg)' };
      case 'thinking':
        return { scaleY: 0.9, transform: 'rotate(5deg)' };
      default:
        return { scaleY: 1 };
    }
  };

  const getMouthShape = () => {
    if (state === 'speaking' && mouthAnimation) {
      return {
        width: '14px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: '#2d1b69'
      };
    }

    switch (expression) {
      case 'happy':
        return {
          width: '16px',
          height: '8px',
          borderRadius: '0 0 16px 16px',
          backgroundColor: '#2d1b69'
        };
      case 'worried':
        return {
          width: '12px',
          height: '6px',
          borderRadius: '12px 12px 0 0',
          backgroundColor: '#2d1b69'
        };
      case 'thinking':
        return {
          width: '8px',
          height: '4px',
          borderRadius: '4px',
          backgroundColor: '#2d1b69'
        };
      default:
        return {
          width: '10px',
          height: '4px',
          borderRadius: '2px',
          backgroundColor: '#2d1b69'
        };
    }
  };

  const getEyebrowPosition = () => {
    switch (expression) {
      case 'worried':
        return { transform: 'rotate(10deg) translateY(2px)' };
      case 'thinking':
        return { transform: 'rotate(-5deg) translateY(-1px)' };
      default:
        return {};
    }
  };

  const getFaceAnimation = () => {
    switch (state) {
      case 'listening':
        return 'pulse 2s infinite';
      case 'speaking':
        return 'speak 0.5s infinite';
      case 'typing':
        return 'bounce 1s infinite';
      default:
        return expression === 'happy' ? 'breathe 3s infinite' : 'breathe 4s infinite';
    }
  };

  const getFaceColor = () => {
    switch (expression) {
      case 'happy':
        return '#fef3c7'; // Light yellow
      case 'worried':
        return '#fecaca'; // Light red
      case 'thinking':
        return '#ddd6fe'; // Light purple
      default:
        return '#f3f4f6'; // Light gray
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer glow effect based on state */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: state === 'listening' ? 
            'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)' :
            state === 'speaking' ?
            'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)' :
            'transparent',
          animation: state === 'listening' ? 'pulse 1.5s infinite' : 'none'
        }}
      />
      
      {/* Face */}
      <div
        className="relative rounded-full border-4 border-white shadow-lg transition-all duration-300"
        style={{
          width: size * 0.8,
          height: size * 0.8,
          backgroundColor: getFaceColor(),
          animation: getFaceAnimation(),
          borderColor: state === 'listening' ? '#8b5cf6' : 
                      state === 'speaking' ? '#22c55e' : '#e5e7eb'
        }}
      >
        {/* Eyes */}
        <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
          <div
            className="bg-gray-800 rounded-full transition-all duration-200"
            style={{
              width: '8px',
              height: '8px',
              ...getEyeShape()
            }}
          />
        </div>
        <div className="absolute top-1/3 right-1/4 transform translate-x-1/2 -translate-y-1/2">
          <div
            className="bg-gray-800 rounded-full transition-all duration-200"
            style={{
              width: '8px',
              height: '8px',
              ...getEyeShape()
            }}
          />
        </div>

        {/* Eyebrows */}
        <div 
          className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
          style={getEyebrowPosition()}
        >
          <div
            className="bg-gray-700 rounded"
            style={{ width: '12px', height: '2px' }}
          />
        </div>
        <div 
          className="absolute top-1/4 right-1/4 transform translate-x-1/2 -translate-y-1/2 transition-all duration-300"
          style={getEyebrowPosition()}
        >
          <div
            className="bg-gray-700 rounded"
            style={{ width: '12px', height: '2px' }}
          />
        </div>

        {/* Nose */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div
            className="bg-gray-400 rounded"
            style={{ width: '3px', height: '4px' }}
          />
        </div>

        {/* Mouth */}
        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div
            className="transition-all duration-200"
            style={getMouthShape()}
          />
        </div>

        {/* Cheeks for happy expression */}
        {expression === 'happy' && (
          <>
            <div 
              className="absolute top-1/2 left-3 transform -translate-y-1/2 bg-pink-300 rounded-full opacity-60"
              style={{ width: '12px', height: '8px' }}
            />
            <div 
              className="absolute top-1/2 right-3 transform -translate-y-1/2 bg-pink-300 rounded-full opacity-60"
              style={{ width: '12px', height: '8px' }}
            />
          </>
        )}
      </div>

      {/* State indicator */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div 
          className={`w-2 h-2 rounded-full ${
            state === 'listening' ? 'bg-purple-500 animate-pulse' :
            state === 'speaking' ? 'bg-green-500 animate-bounce' :
            state === 'typing' ? 'bg-blue-500 animate-ping' :
            'bg-gray-400'
          }`}
        />
      </div>
    </div>
  );
}