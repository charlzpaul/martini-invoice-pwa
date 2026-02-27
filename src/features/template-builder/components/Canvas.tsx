// src/features/template-builder/components/Canvas.tsx
import { useTemplateStore } from '../store/useTemplateStore';
import { DndContext, type DragEndEvent, useDraggable } from '@dnd-kit/core';
import { DraggableImage } from './DraggableImage';
import { DraggableLabel } from './DraggableLabel';
import { Resizable } from 're-resizable';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const PAPER_SIZES = {
  A4: { width: '210mm', height: '297mm', aspectRatio: '210/297' },
  Letter: { width: '8.5in', height: '11in', aspectRatio: '8.5/11' },
};

function DraggableLineItemArea() {
  const activeTemplate = useTemplateStore((state) => state.activeTemplate);
  const selectedItemId = useTemplateStore((state) => state.selectedItemId);
  const updateActiveTemplate = useTemplateStore((state) => state.updateActiveTemplate);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'line-item-area',
    disabled: selectedItemId !== 'line-items-area',
  });

  const [isResizing, setIsResizing] = useState(false);

  if (!activeTemplate) return null;

  const style = transform
    ? {
        transform: `translate3d(0, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleResizeStop = (_e: any, _direction: any, _ref: any, d: any) => {
    if (isResizing) return;
    
    setIsResizing(true);
    const newHeight = Math.max(100, Math.min(800, activeTemplate.lineItemArea.height + d.height));
    updateActiveTemplate({
      lineItemArea: { ...activeTemplate.lineItemArea, height: newHeight }
    });
    
    setTimeout(() => setIsResizing(false), 100);
  };

  const canvasHeight = 1123; // A4 height at 96 DPI
  const topPercent = (activeTemplate.lineItemArea.y / canvasHeight) * 100;

  return (
    <Resizable
      size={{ width: '90%', height: activeTemplate.lineItemArea.height }}
      onResizeStop={handleResizeStop}
      enable={{ top: false, right: false, bottom: true, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
      className="absolute"
      style={{
        top: `${topPercent}%`,
        left: '5%',
        right: '5%',
        ...style,
      }}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={cn(
          "bg-accent/20 border-2 border-dashed border-accent cursor-move",
          "hover:bg-accent/30 hover:border-accent/80 transition-colors"
        )}
        style={{ height: '100%' }}
      >
        <div className="flex flex-col items-center justify-center h-full p-4">
          <p className="text-center text-accent-foreground font-medium">Line Items Area</p>
          <p className="text-center text-accent-foreground/70 text-sm mt-1">
            Drag to move • Drag bottom edge to resize
          </p>
          <p className="text-center text-accent-foreground/60 text-xs mt-2">
            This is where invoice line items will appear
          </p>
        </div>
      </div>
    </Resizable>
  );
}

export function Canvas() {
  const activeTemplate = useTemplateStore((state) => state.activeTemplate);
  const updateActiveTemplate = useTemplateStore((state) => state.updateActiveTemplate);
  const selectedItemId = useTemplateStore((state) => state.selectedItemId);
  const setSelectedItemId = useTemplateStore((state) => state.setSelectedItemId);

  if (!activeTemplate) {
    return null;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const itemId = active.id as string;

    // Canvas dimensions at 96 DPI
    const canvasWidth = activeTemplate.paperSize === 'A4' ? 794 : 816; // A4: 794px, Letter: 816px
    const canvasHeight = activeTemplate.paperSize === 'A4' ? 1123 : 1056; // A4: 1123px, Letter: 1056px

    // Check if it's the line item area
    if (itemId === 'line-item-area') {
      const newY = Math.max(0, Math.min(canvasHeight - activeTemplate.lineItemArea.height, activeTemplate.lineItemArea.y + delta.y));
      updateActiveTemplate({
        lineItemArea: { ...activeTemplate.lineItemArea, y: newY }
      });
      return;
    }

    const isImage = activeTemplate.images.some(img => img.id === itemId);

    if (isImage) {
        const updatedImages = activeTemplate.images.map(image => {
          if (image.id === itemId) {
            // Get image dimensions
            const imageWidth = image.currentWidth || 100;
            const imageHeight = image.currentHeight || 100;
            
            // Calculate new position with bounds checking
            let newX = image.x + delta.x;
            let newY = image.y + delta.y;
            
            // Ensure image stays within canvas bounds
            newX = Math.max(0, Math.min(canvasWidth - imageWidth, newX));
            newY = Math.max(0, Math.min(canvasHeight - imageHeight, newY));
            
            return { ...image, x: newX, y: newY };
          }
          return image;
        });
        updateActiveTemplate({ images: updatedImages });
    } else {
        const updatedLabels = activeTemplate.labels.map(label => {
            if (label.id === itemId) {
                // Get label dimensions
                const labelWidth = label.width || 200;
                const labelHeight = label.height || 30;
                
                // Calculate new position with bounds checking
                let newX = label.x + delta.x;
                let newY = label.y + delta.y;
                
                // Ensure label stays within canvas bounds
                newX = Math.max(0, Math.min(canvasWidth - labelWidth, newX));
                newY = Math.max(0, Math.min(canvasHeight - labelHeight, newY));
                
                return { ...label, x: newX, y: newY };
            }
            return label;
        });
        updateActiveTemplate({ labels: updatedLabels });
    }
  };

  const paper = PAPER_SIZES[activeTemplate.paperSize];
  const containerStyle: React.CSSProperties = {
    aspectRatio: paper.aspectRatio,
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="w-full max-w-4xl mx-auto p-4 bg-muted rounded-lg">
        <div
          style={containerStyle}
          className="bg-card text-card-foreground shadow-lg relative mx-auto overflow-hidden"
          onClick={() => setSelectedItemId(null)} // Unselect when clicking canvas
          data-testid="template-canvas"
        >
          {/* Render Draggable Images */}
          {activeTemplate.images.map(image => (
            <div key={image.id} style={{ position: 'absolute', top: image.y, left: image.x }}>
               <DraggableImage 
                image={image}
                isSelected={selectedItemId === image.id}
               />
            </div>
          ))}

          {/* Render Draggable Labels */}
          {activeTemplate.labels.map(label => (
             <div key={label.id} style={{ position: 'absolute', top: label.y, left: label.x }}>
               <DraggableLabel 
                label={label}
                isSelected={selectedItemId === label.id}
               />
            </div>
          ))}

          {/* Interactive Line Item Area */}
          <DraggableLineItemArea />

        </div>
      </div>
    </DndContext>
  );
}
