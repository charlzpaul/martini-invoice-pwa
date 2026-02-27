// src/features/template-builder/components/LayerList.tsx
import { useTemplateStore } from '../store/useTemplateStore';
import { cn } from '@/lib/utils';
import { Image, Type, Trash2, List } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export function LayerList() {
  const activeTemplate = useTemplateStore((state) => state.activeTemplate);
  const selectedItemId = useTemplateStore((state) => state.selectedItemId);
  const setSelectedItemId = useTemplateStore((state) => state.setSelectedItemId);
  const updateActiveTemplate = useTemplateStore((state) => state.updateActiveTemplate);

  if (!activeTemplate) return null;

  // Font options for invoice-appropriate fonts
  const fontOptions = [
    { id: 'Arial', name: 'Arial' },
    { id: 'Times New Roman', name: 'Times New Roman' },
    { id: 'Helvetica', name: 'Helvetica' },
    { id: 'Georgia', name: 'Georgia' },
    { id: 'Courier New', name: 'Courier New' },
  ];

  // Combine images, labels, and line item area into a single list for rendering
  const layers = [
    ...activeTemplate.images.map(img => ({ ...img, itemType: 'Image' })),
    ...activeTemplate.labels.map(lbl => ({ ...lbl, itemType: 'Label' })),
    // Add line item area as a special layer
    {
      id: 'line-items-area',
      itemType: 'LineItemsArea' as const,
      textValue: 'Line Items Area',
      x: 0,
      y: activeTemplate.lineItemArea.y,
      width: 0,
      height: activeTemplate.lineItemArea.height,
    }
  ];

  const handleDeleteLayer = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the layer when clicking delete
    
    // Prevent deletion of line items area
    if (layerId === 'line-items-area') {
      return;
    }
    
    const isImage = activeTemplate.images.some(img => img.id === layerId);
    if (isImage) {
      const updatedImages = activeTemplate.images.filter(img => img.id !== layerId);
      updateActiveTemplate({ images: updatedImages });
    } else {
      const updatedLabels = activeTemplate.labels.filter(lbl => lbl.id !== layerId);
      updateActiveTemplate({ labels: updatedLabels });
    }
    
    // If the deleted layer was selected, clear selection
    if (selectedItemId === layerId) {
      setSelectedItemId(null);
    }
  };

  const handleFontChange = (layerId: string, fontFamily: string) => {
    // For labels, update font family
    const label = activeTemplate.labels.find(lbl => lbl.id === layerId);
    if (label) {
      const updatedLabels = activeTemplate.labels.map(lbl =>
        lbl.id === layerId ? { ...lbl, fontFamily } : lbl
      );
      updateActiveTemplate({ labels: updatedLabels });
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Layers & Styles</h3>
      <div className="space-y-1 rounded-md border p-2">
        {layers.map(layer => (
          <div
            key={layer.id}
            onClick={() => setSelectedItemId(layer.id)}
            className={cn(
              "flex items-center justify-between rounded-md p-2 text-sm cursor-pointer hover:bg-accent group",
              layer.id === selectedItemId && "bg-accent font-semibold"
            )}
          >
            <div className="flex items-center space-x-2 flex-grow min-w-0">
              {layer.itemType === 'Image' ?
                <Image className="h-4 w-4 flex-shrink-0" /> :
                layer.itemType === 'Label' ?
                <Type className="h-4 w-4 flex-shrink-0" /> :
                <List className="h-4 w-4 flex-shrink-0" />
              }
              <span className="truncate">
                {layer.itemType === 'Image' ? `Image: ${layer.id.substring(0, 6)}` :
                 layer.itemType === 'Label' ? (layer as any).textValue?.substring(0, 30) || 'Label' :
                 'Line Items Area'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              {layer.itemType === 'Label' && (
               <div onClick={(e) => e.stopPropagation()}>
                 <Select
                   value={(layer as any).fontFamily || 'Arial'}
                   onValueChange={(value) => handleFontChange(layer.id, value)}
                 >
                   <SelectTrigger className="h-6 w-28 text-xs">
                     <SelectValue placeholder="Font" />
                   </SelectTrigger>
                   <SelectContent>
                     {fontOptions.map(font => (
                       <SelectItem key={font.id} value={font.id}>{font.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}
              
              {layer.itemType !== 'LineItemsArea' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleDeleteLayer(layer.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {layers.length === 0 && (
            <p className="p-2 text-xs text-muted-foreground">No layers yet. Add images or blocks to get started.</p>
        )}
      </div>
    </div>
  );
}
