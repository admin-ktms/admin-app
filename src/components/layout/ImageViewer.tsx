import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageViewerProps {
  isOpen: boolean;
  src: string | null;
  alt?: string;
  title?: string;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  isOpen,
  src,
  alt = 'Inspection Evidence',
  title = 'Media Verification Inspection',
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastTouchDistanceRef = useRef<number | null>(null);

  // Reset transforms whenever a new image opens or modal closes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, src]);

  // Keyboard escape dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Touch gesture support: Pinch-to-zoom & two-finger drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistanceRef.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - lastTouchDistanceRef.current) / 100;
      setScale((prev) => Math.min(Math.max(prev + delta, 1), 4));
      lastTouchDistanceRef.current = dist;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistanceRef.current = null;
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md select-none">
      {/* Lightbox Action Header */}
      <div className="flex items-center justify-between border-b border-ktms-border bg-ktms-panel px-4 py-3 pt-safe">
        <div className="flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ktms-text">{title}</h3>
          <span className="text-[10px] font-mono text-ktms-muted">Zoom: {scale.toFixed(1)}x</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded text-ktms-muted hover:text-white hover:bg-ktms-surface min-h-touch min-w-touch flex items-center justify-center transition"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 rounded text-ktms-muted hover:text-white hover:bg-ktms-surface min-h-touch min-w-touch flex items-center justify-center transition disabled:opacity-40"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded text-ktms-muted hover:text-white hover:bg-ktms-surface min-h-touch min-w-touch flex items-center justify-center transition"
            title="Reset Scale"
          >
            <RotateCcw size={16} />
          </button>
          <div className="h-4 w-[1px] bg-ktms-border mx-1" />
          <button
            onClick={onClose}
            className="p-2 rounded text-ktms-muted hover:text-ktms-coral hover:bg-ktms-surface min-h-touch min-w-touch flex items-center justify-center transition"
            title="Close Lightbox"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Media Viewport Canvas */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden p-2 touch-none cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleReset}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="max-h-[85vh] max-w-[95vw] object-contain rounded shadow-2xl pointer-events-auto"
        />
      </div>

      <div className="text-center py-2 text-[10px] font-mono text-ktms-muted/70 pb-safe">
        Pinch or double-tap to zoom • Drag to pan • Press ESC to close
      </div>
    </div>
  );
};
