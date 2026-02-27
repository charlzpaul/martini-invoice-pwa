// src/features/template-builder/components/SettingsPanel.tsx
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplateStore } from '../store/useTemplateStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import type { CanvasImage, CanvasLabel } from '@/db/models';
import { LayerList } from './LayerList';
import { ChevronDown, User, Calendar, DollarSign, FileText, List } from 'lucide-react';

export function SettingsPanel() {
  const {
    activeTemplate,
    updateActiveTemplate,
    saveTemplate,
    saveAsCopy,
    selectedItemId,
    setSelectedItemId,
  } = useTemplateStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const selectedItem = useMemo(() => {
    if (!activeTemplate || !selectedItemId) return null;
    const image = activeTemplate.images.find(img => img.id === selectedItemId);
    if (image) return { type: 'image', data: image };
    const label = activeTemplate.labels.find(lbl => lbl.id === selectedItemId);
    if (label) return { type: 'label', data: label };
    return null;
  }, [activeTemplate, selectedItemId]);

  if (!activeTemplate) return null;


  const handleSave = async () => {
    toast.promise(saveTemplate, {
      loading: 'Saving template...',
      success: (savedTemplate) => {
        // Navigate to home page after successful save
        navigate('/');
        return `Template "${savedTemplate?.name}" saved successfully!`;
      },
      error: 'Failed to save template.',
    });
  };

  const handleSaveAsCopy = async () => {
    toast.promise(saveAsCopy, {
      loading: 'Saving a copy...',
      success: (savedTemplate) => {
        // Navigate to home page after successful save
        navigate('/');
        return `Template copy "${savedTemplate?.name}" created successfully!`;
      },
      error: 'Failed to save copy.',
    });
  };

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const [showBlockOptions, setShowBlockOptions] = useState(false);

  const handleAddDefaultBlock = (blockType: string) => {
    if (!activeTemplate) return;
    
    const newId = `default-${blockType}-${Date.now()}`;
    let newLabel: CanvasLabel;
    
    // Calculate Y position: get max Y from existing labels or use 100 as default
    const labelYs = activeTemplate.labels.map(l => l.y);
    const maxY = labelYs.length > 0 ? Math.max(...labelYs) : 100;
    
    switch (blockType) {
      case 'customer-info':
        newLabel = {
          id: newId,
          type: 'Custom',
          textValue: 'John Doe\n123 Main St, City, State 12345\nPhone: (555) 123-4567\nTax ID: 123-45-6789',
          isVisible: true,
          x: 50,
          y: maxY + 40,
          fontSize: 12,
          fontFamily: 'Arial',
          width: 200,
          height: 80,
        };
        break;
      case 'date-block':
        newLabel = {
          id: newId,
          type: 'Custom',
          textValue: 'Date: January 1, 2023',
          isVisible: true,
          x: 50,
          y: maxY + 40,
          fontSize: 14,
          width: 200,
          height: 30,
        };
        break;
      case 'invoice-number':
        newLabel = {
          id: newId,
          type: 'Custom',
          textValue: 'Invoice #: INV-2023-001',
          isVisible: true,
          x: 50,
          y: maxY + 40,
          fontSize: 14,
          width: 200,
          height: 30,
        };
        break;
      case 'totals-block':
        newLabel = {
          id: newId,
          type: 'Custom',
          textValue: 'Subtotal: $0.00\nTax 1 (10%): $0.00\nTax 2 (5%): $0.00\nTotal: $0.00',
          isVisible: true,
          x: 300,
          y: 400,
          fontSize: 12,
          fontFamily: 'Arial',
          width: 200,
          height: 100,
        };
        break;
      case 'line-items-area':
        // Ensure line items area exists with default values
        updateActiveTemplate({
          lineItemArea: { y: 250, height: 400 }
        });
        setShowBlockOptions(false);
        toast.success('Added line items area');
        return;
      default:
        return;
    }
    
    const updatedLabels = [...activeTemplate.labels, newLabel];
    updateActiveTemplate({ labels: updatedLabels });
    setSelectedItemId(newId);
    setShowBlockOptions(false);
    toast.success(`Added ${blockType.replace('-', ' ')} block`);
  };

  // Function to resize and compress an image for PDF generation
  const resizeAndCompressImage = (
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number,
    callback: (compressedBase64: string) => void
  ) => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      callback(img.src); // Fallback to original if canvas not supported
      return;
    }
    
    // Draw image onto canvas with the target dimensions
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    
    // Convert to compressed base64 with reduced quality
    // Use JPEG format for better compression (even for PNGs)
    const quality = 0.7; // 70% quality for good balance
    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
    
    callback(compressedBase64);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if activeTemplate exists
    if (!activeTemplate) {
      toast.error('Cannot add image: No active template');
      return;
    }

    // Validate file type - only accept images, not PDF
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG only)');
      return;
    }

    // Validate file size (optional, limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size too large. Please select a file smaller than 5MB');
      return;
    }

    // Capture current activeTemplate for use in async callbacks
    const currentActiveTemplate = activeTemplate;
    const currentUpdateActiveTemplate = updateActiveTemplate;
    const currentSetSelectedItemId = setSelectedItemId;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      
      // Create a new image element to get dimensions
      const img = new Image();
      img.onload = () => {
        // Canvas dimensions based on selected paper size at 96 DPI
        // A4: 210mm x 297mm = 8.27in x 11.69in ≈ 794px x 1123px at 96 DPI
        // Letter: 8.5in x 11in = 816px x 1056px at 96 DPI
        const canvasDimensions = {
          A4: { width: 794, height: 1123 },
          Letter: { width: 816, height: 1056 }
        };
        
        const paperSize = currentActiveTemplate.paperSize;
        const canvasWidth = canvasDimensions[paperSize].width;
        const canvasHeight = canvasDimensions[paperSize].height;
        
        // Ensure image has valid dimensions
        if (img.width <= 0 || img.height <= 0) {
          toast.error('Invalid image dimensions');
          return;
        }
        
        // Calculate scale to make image cover canvas (cover mode)
        // Scale image so that its longest edges parallel to canvas edges overlap
        const widthRatio = canvasWidth / img.width;
        const heightRatio = canvasHeight / img.height;
        const scale = Math.max(widthRatio, heightRatio); // Use max for cover
        
        // Ensure minimum size of 50px
        const minSize = 50;
        const width = Math.max(Math.floor(img.width * scale), minSize);
        const height = Math.max(Math.floor(img.height * scale), minSize);
        
        // Center the image on canvas (may extend beyond canvas edges)
        const x = (canvasWidth - width) / 2;
        const y = (canvasHeight - height) / 2;
        
        // Resize and compress the image to the actual display size
        resizeAndCompressImage(img, width, height, (compressedBase64) => {
          const newImage = {
            id: `image-${Date.now()}`,
            base64Data: compressedBase64,
            originalWidth: img.width,
            originalHeight: img.height,
            currentWidth: width,
            currentHeight: height,
            x: x,
            y: y,
            opacity: 1,
          };

          // Add the new image to the template
          const updatedImages = [...currentActiveTemplate.images, newImage];
          currentUpdateActiveTemplate({ images: updatedImages });
          
          // Select the new image
          currentSetSelectedItemId(newImage.id);
          
          toast.success('Image added successfully (compressed for PDF)');
        });
      };
      
      img.onerror = () => {
        toast.error('Failed to load image. The file may be corrupted or not a valid image.');
      };
      
      img.src = base64Data;
    };
    
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    
    reader.readAsDataURL(file);

    // Reset the file input so the same file can be selected again
    e.target.value = '';
  };
  
  const handleOpacityChange = (value: number[]) => {
      if(selectedItem?.type !== 'image') return;
      const updatedImages = activeTemplate.images.map(img =>
        img.id === selectedItem.data.id ? { ...img, opacity: value[0] } : img
      );
      updateActiveTemplate({ images: updatedImages });
  };

  const handleLabelTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(selectedItem?.type !== 'label') return;
    const updatedLabels = activeTemplate.labels.map(lbl =>
        lbl.id === selectedItem.data.id ? { ...lbl, textValue: e.target.value } : lbl
    );
    updateActiveTemplate({ labels: updatedLabels });
  };

  const handleFontSizeChange = (value: number[]) => {
    if(selectedItem?.type !== 'label') return;
    const updatedLabels = activeTemplate.labels.map(lbl =>
        lbl.id === selectedItem.data.id ? { ...lbl, fontSize: value[0] } : lbl
    );
    updateActiveTemplate({ labels: updatedLabels });
  };

  const renderSelectedItemSettings = () => {
    if (!selectedItem) return null;

    if (selectedItem.type === 'image') {
      const image = selectedItem.data as CanvasImage;
      return (
        <div className="space-y-4">
            <h3 className="font-semibold">Selected Image</h3>
             <div className="space-y-2">
                <Label htmlFor="opacity-slider">Opacity</Label>
                <Slider
                    id="opacity-slider"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[image.opacity]}
                    onValueChange={handleOpacityChange}
                />
            </div>
        </div>
      );
    }

    if (selectedItem.type === 'label') {
        const label = selectedItem.data as CanvasLabel;
        return (
             <div className="space-y-4">
                <h3 className="font-semibold">Selected Label</h3>
                <div className="space-y-2">
                    <Label htmlFor="label-text">Text</Label>
                    <Input id="label-text" value={label.textValue} onChange={handleLabelTextChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="font-size-slider">Font Size</Label>
                    <Slider
                        id="font-size-slider"
                        min={8}
                        max={72}
                        step={1}
                        value={[label.fontSize]}
                        onValueChange={handleFontSizeChange}
                    />
                </div>
            </div>
        )
    }

    return null;
  }

  return (
    <div className="flex flex-col h-full p-4 border rounded-lg" data-testid="settings-panel">
      <div className="space-y-6 flex-grow overflow-y-auto">
        <div className="space-y-4">
          <h3 className="font-semibold">Template Settings</h3>
          <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
              id="template-name"
              value={activeTemplate.name}
              onChange={(e) => updateActiveTemplate({ name: e.target.value })}
              />
          </div>
          <div className="space-y-2">
              <Label htmlFor="paper-size">Paper Size</Label>
              <Select
              value={activeTemplate.paperSize}
              onValueChange={(value: 'A4' | 'Letter') => updateActiveTemplate({ paperSize: value })}
              >
              <SelectTrigger id="paper-size">
                  <SelectValue placeholder="Select paper size" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
              </SelectContent>
              </Select>
          </div>
        </div>

        
        <div className="space-y-2">
          <Button variant="outline" onClick={handleAddImageClick} className="w-full">
            Add Image
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="hidden"
          />
          
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowBlockOptions(!showBlockOptions)}
              className="w-full flex items-center justify-center relative"
            >
              <span>Add Default Block</span>
              <ChevronDown className={`h-4 w-4 absolute right-3 transition-transform ${showBlockOptions ? 'rotate-180' : ''}`} />
            </Button>
            
            {showBlockOptions && (
              <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => handleAddDefaultBlock('customer-info')}
                    className="w-full flex items-center space-x-2 p-2 text-sm hover:bg-accent rounded-md text-left"
                  >
                    <User className="h-4 w-4" />
                    <span>Customer Info Block</span>
                  </button>
                  <button
                    onClick={() => handleAddDefaultBlock('date-block')}
                    className="w-full flex items-center space-x-2 p-2 text-sm hover:bg-accent rounded-md text-left"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Date Block</span>
                  </button>
                  <button
                    onClick={() => handleAddDefaultBlock('invoice-number')}
                    className="w-full flex items-center space-x-2 p-2 text-sm hover:bg-accent rounded-md text-left"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Invoice Number Block</span>
                  </button>
                  <button
                    onClick={() => handleAddDefaultBlock('totals-block')}
                    className="w-full flex items-center space-x-2 p-2 text-sm hover:bg-accent rounded-md text-left"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Totals Block</span>
                  </button>
                  <button
                    onClick={() => handleAddDefaultBlock('line-items-area')}
                    className="w-full flex items-center space-x-2 p-2 text-sm hover:bg-accent rounded-md text-left"
                  >
                    <List className="h-4 w-4" />
                    <span>Line Items Area</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <LayerList />

        {renderSelectedItemSettings() && <div className="pt-4 border-t">{renderSelectedItemSettings()}</div>}
      </div>

      <div className="space-y-2 pt-4 border-t mt-4">
        <Button onClick={() => alert("Preview functionality coming soon!")} variant="outline" className="w-full">Preview</Button>
        <Button onClick={handleSaveAsCopy} variant="secondary" className="w-full">Save as Copy</Button>
        <Button onClick={handleSave} className="w-full">Save Changes</Button>
      </div>
    </div>
  );
}
