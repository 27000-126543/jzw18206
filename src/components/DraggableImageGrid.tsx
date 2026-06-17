import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, GripVertical } from 'lucide-react';

interface DraggableImageGridProps {
  images: string[];
  onReorder: (newImages: string[]) => void;
  onRemove: (index: number) => void;
  onAddImages?: () => void;
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function DraggableImageGrid({
  images,
  onReorder,
  onRemove,
  onAddImages,
}: DraggableImageGridProps) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
    dragIndexRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (dropIndex: number) => {
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) return;

    const newImages = [...images];
    const [draggedItem] = newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);
    onReorder(newImages);

    dragIndexRef.current = null;
    setDragOverIndex(null);
    setDraggingIndex(null);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((img, i) => (
        <motion.div
          key={`${img}-${i}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: draggingIndex === i ? 0.5 : 1, scale: 1 }}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragEnter={() => handleDragEnter(i)}
          onDragLeave={handleDragLeave}
          onDrop={() => handleDrop(i)}
          className={cn(
            'relative aspect-square rounded-xl overflow-hidden bg-ink-100 border-2 transition-colors',
            dragOverIndex === i ? 'border-blue-400 border-dashed' : 'border-transparent',
            draggingIndex === i && 'opacity-50'
          )}
        >
          <img
            src={img}
            alt={`upload-${i}`}
            className="w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute top-1 left-1 cursor-grab active:cursor-grabbing p-0.5 rounded bg-black/30 text-white/70 hover:text-white">
            <GripVertical className="w-3 h-3" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(i);
            }}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      ))}
      {images.length < 9 && onAddImages && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          onClick={onAddImages}
          className="aspect-square rounded-xl border-2 border-dashed border-ink-200 hover:border-brand-400 hover:bg-brand-50/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-ink-400 hover:text-brand-500"
        >
          <Plus className="w-6 h-6" />
          <span className="text-xs">添加图片</span>
        </motion.button>
      )}
    </div>
  );
}
