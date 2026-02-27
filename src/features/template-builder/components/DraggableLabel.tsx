// src/features/template-builder/components/DraggableLabel.tsx
import { useDraggable } from '@dnd-kit/core';
import type { CanvasLabel } from '@/db/models';
import { useTemplateStore } from '../store/useTemplateStore';
import { cn } from '@/lib/utils';
import { Resizable, type ResizeCallback } from 're-resizable';
import React from 'react';

interface DraggableLabelProps {
  label: CanvasLabel;
  isSelected: boolean;
}

export function DraggableLabel({ label, isSelected }: DraggableLabelProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: label.id,
    disabled: !isSelected,
  });
  
  const setSelectedItemId = useTemplateStore((state) => state.setSelectedItemId);
  const updateActiveTemplate = useTemplateStore((state) => state.updateActiveTemplate);
  const activeTemplate = useTemplateStore((state) => state.activeTemplate);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const isResizingRef = React.useRef(false);
  const handleResizeStop: ResizeCallback = (_e, _direction, _ref, d) => {
    if (isResizingRef.current || !activeTemplate) return;
    
    isResizingRef.current = true;
    const newWidth = (label.width || 200) + d.width;
    const newHeight = (label.height || 30) + d.height;

    const updatedLabels = activeTemplate.labels.map(lbl =>
      lbl.id === label.id ? { ...lbl, width: newWidth, height: newHeight } : lbl
    );
    updateActiveTemplate({ labels: updatedLabels });
    
    // Reset flag after a short delay
    setTimeout(() => {
      isResizingRef.current = false;
    }, 100);
  };

  const width = label.width || 200;
  const height = label.height || 30;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`absolute ${isSelected ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedItemId(label.id);
      }}
    >
      <Resizable
        size={{ width, height }}
        onResizeStop={handleResizeStop}
        className={cn(
          "relative border-2 border-transparent",
          isSelected && "border-accent border-dashed"
        )}
      >
        <div className="w-full h-full p-1 overflow-hidden">
          <span style={{
            fontSize: label.fontSize,
            fontFamily: label.fontFamily || 'Arial',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {label.textValue}
          </span>
        </div>
      </Resizable>
    </div>
  );
}
