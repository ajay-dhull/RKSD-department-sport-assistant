import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardGalleryProps {
  items: { image: string; text: string }[];
}

export default function DashboardGallery({ items }: DashboardGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    if (isAutoPlaying) {
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === items.length - 1 ? 0 : prevIndex + 1
        );
      }, 4000);
    }

    return () => {
      resetTimeout();
    };
  }, [currentIndex, items.length, isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 6000);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Main Gallery Container */}
      <div className="relative w-full h-full flex items-center justify-center perspective-[1000px]">
        {items.map((item, index) => {
          const position = index - currentIndex;
          const isActive = position === 0;
          const isNext = position === 1 || (currentIndex === items.length - 1 && index === 0);
          const isPrev = position === -1 || (currentIndex === 0 && index === items.length - 1);

          let transform = 'translateX(0) translateZ(-400px) scale(0.7)';
          let opacity = 0;
          let zIndex = 0;

          if (isActive) {
            transform = 'translateX(0) translateZ(0) scale(1)';
            opacity = 1;
            zIndex = 3;
          } else if (isNext) {
            transform = 'translateX(40%) translateZ(-200px) scale(0.85) rotateY(-15deg)';
            opacity = 0.6;
            zIndex = 2;
          } else if (isPrev) {
            transform = 'translateX(-40%) translateZ(-200px) scale(0.85) rotateY(15deg)';
            opacity = 0.6;
            zIndex = 2;
          }

          return (
            <div
              key={index}
              className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out"
              style={{
                transform,
                opacity,
                zIndex,
              }}
            >
              <div className="relative w-full max-w-4xl h-full flex items-center justify-center p-8">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-orange-500/30 bg-black/40 backdrop-blur-sm">
                  <img
                    src={item.image}
                    alt={item.text}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/800x600/1a1a1a/f97316?text=' + encodeURIComponent(item.text);
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <h3 className="text-2xl font-bold text-white text-center">{item.text}</h3>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-orange-500/80 hover:bg-orange-500 text-white transition-all shadow-lg hover:scale-110"
        aria-label="Previous"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-orange-500/80 hover:bg-orange-500 text-white transition-all shadow-lg hover:scale-110"
        aria-label="Next"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-orange-500 w-8'
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
