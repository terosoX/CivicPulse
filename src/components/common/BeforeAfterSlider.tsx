import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeftRight, Columns, Layers } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  heightClass?: string;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before Work',
  afterLabel = 'After Work',
  heightClass = 'h-72 sm:h-96',
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'slider' | 'sideBySide'>('slider');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div className="space-y-2">
      {/* View Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
          <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Field Verification Image Comparison</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'slider'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Slider</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('sideBySide')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              viewMode === 'sideBySide'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleMove(e.clientX);
          }}
          onTouchStart={(e) => {
            setIsDragging(true);
            handleMove(e.touches[0].clientX);
          }}
          className={`relative ${heightClass} w-full rounded-2xl overflow-hidden select-none cursor-ew-resize border border-slate-200 dark:border-slate-700 shadow-inner group bg-slate-900`}
        >
          {/* After Image (Background / Underneath) */}
          <img
            src={afterImage}
            alt="After Work"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800';
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* After Label Badge */}
          <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full bg-emerald-600/90 text-white font-bold text-[10px] uppercase tracking-wider backdrop-blur-xs shadow-md">
            {afterLabel}
          </div>

          {/* Before Image (Clipped Layer on Top) */}
          <div
            className="absolute top-0 bottom-0 left-0 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={beforeImage}
              alt="Before Work"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800';
              }}
              className="absolute top-0 bottom-0 left-0 max-w-none h-full object-cover"
              style={{
                width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
              }}
            />
          </div>

          {/* Before Label Badge */}
          <div
            className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-red-600/90 text-white font-bold text-[10px] uppercase tracking-wider backdrop-blur-xs shadow-md transition-opacity"
            style={{ opacity: sliderPosition > 15 ? 1 : 0 }}
          >
            {beforeLabel}
          </div>

          {/* Divider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 z-20 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-blue-600 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-lg transform active:scale-110 transition-transform">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      ) : (
        /* Side-by-side view */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="absolute top-2 left-2 z-10 px-2.5 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-xs">
              {beforeLabel}
            </div>
            <img
              src={beforeImage}
              alt={beforeLabel}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800';
              }}
              className="w-full h-48 sm:h-56 object-cover"
            />
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
            <div className="absolute top-2 left-2 z-10 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-xs">
              {afterLabel}
            </div>
            <img
              src={afterImage}
              alt={afterLabel}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800';
              }}
              className="w-full h-48 sm:h-56 object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
