// src/features/invoice-builder/InvoiceBuilderPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoiceStore } from './store/useInvoiceStore';
import { useTemplateStore } from '@/features/template-builder/store/useTemplateStore';
import { useStore } from '@/store/useStore';
import { AppLayout } from '@/app/AppLayout';
import { HeaderForm } from './components/HeaderForm';
import { LineItemsTable } from './components/LineItemsTable';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import * as dbApi from '@/db/api';
import { Home } from 'lucide-react';

export function InvoiceBuilderPage() {
  const { id } = useParams<{ id: string }>();
  console.log('InvoiceBuilderPage id:', id);
  const navigate = useNavigate();
  const {
    activeInvoice,
    loading,
    error,
    isDirty,
    loadInvoice,
    createNewInvoice,
    saveInvoice,
    saveAsCopy,
  } = useInvoiceStore();
  const { activeTemplate, loadTemplate } = useTemplateStore();
  const currencySymbol = useStore((state) => state.currencySymbol);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    console.log('useEffect with id:', id);
    if (id) {
      if (id === 'new') {
        console.log('calling createNewInvoice');
        createNewInvoice();
      } else {
        console.log('calling loadInvoice with id:', id);
        loadInvoice(id);
      }
    }
  }, [id, loadInvoice, createNewInvoice]);

  // Load template when invoice is loaded or when template selection changes
  useEffect(() => {
    if (activeInvoice?.templateId) {
      // Only load template if it's different from the currently loaded template
      if (!activeTemplate || activeTemplate.id !== activeInvoice.templateId) {
        loadTemplate(activeInvoice.templateId);
      }
    }
  }, [activeInvoice?.templateId, activeTemplate, loadTemplate]);

  const handleSave = async () => {
    if (!activeInvoice?.customerId || !activeInvoice?.templateId) {
        toast.error("Validation Error", {
            description: "Please select a customer and a template before saving.",
        });
        return;
    }
    
    try {
      toast.loading('Saving record...');
      await saveInvoice();
      // Navigate directly to home page without showing success message
      navigate('/');
    } catch (error) {
      toast.error('Failed to save record.');
    }
  };

  const handleSaveAsCopy = () => {
     if (!activeInvoice?.customerId || !activeInvoice?.templateId) {
        toast.error("Validation Error", {
            description: "Please select a customer and a template before saving.",
        });
        return;
    }
    toast.promise(saveAsCopy, {
        loading: 'Saving a copy...',
        success: (saved) => {
            if (saved?.id) {
                navigate(`/invoice/${saved.id}`);
            }
            return 'Record copy created successfully!';
        },
        error: 'Failed to save copy.',
    });
  };

  const handleGeneratePdf = async () => {
    console.log('1. Generate PDF button clicked');
    
    // Prevent multiple clicks
    if (isGeneratingPdf) {
      console.log('PDF generation already in progress');
      return;
    }
    
    // Show warning about potential browser hanging
    toast.warning('PDF generation may temporarily freeze the browser. Please wait...', {
      duration: 5000,
    });
    
    setIsGeneratingPdf(true);
    
    // Create a loading toast with ID so we can update it
    const loadingToastId = toast.loading('Preparing PDF generation...');
    
    try {
        // Add a timeout to prevent hanging - use a more aggressive timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('PDF generation timeout after 15 seconds')), 15000);
        });
        
        // Check if invoice needs to be saved
        console.log('2. Checking if invoice needs to be saved');
        let invoiceToUse = activeInvoice;
        if (activeInvoice?.id === 'new' || isDirty) {
            // Validate required fields before saving
            if (!activeInvoice?.customerId || !activeInvoice?.templateId) {
                toast.dismiss(loadingToastId);
                setIsGeneratingPdf(false);
                toast.error("Validation Error", {
                    description: "Please select a customer and a template before generating a PDF.",
                });
                return;
            }
            
            toast.loading('Saving record before generating PDF...');
            const savedInvoice = await saveInvoice();
            
            if (!savedInvoice) {
                toast.dismiss(loadingToastId);
                setIsGeneratingPdf(false);
                toast.error("Failed to save record");
                return;
            }
            
            // Use the saved invoice for PDF generation
            invoiceToUse = savedInvoice;
            toast.success('Record saved successfully');
        }
        
        // Generate PDF directly without storing in DB
        if (!invoiceToUse?.templateId) {
            toast.dismiss(loadingToastId);
            setIsGeneratingPdf(false);
            toast.error("Template Required", {
                description: "Please select a template before generating a PDF.",
            });
            return;
        }
        
        const template = await dbApi.getTemplateById(invoiceToUse.templateId);
        if (!template) {
            toast.dismiss(loadingToastId);
            setIsGeneratingPdf(false);
            toast.error("Template Not Found", {
                description: "Could not find the selected template.",
            });
            return;
        }

        // Load customer data
        let customer = null;
        if (invoiceToUse.customerId) {
            customer = await dbApi.getCustomerById(invoiceToUse.customerId);
        }

        // Import PDF generator dynamically
        console.log('5. Importing PDF generator');
        toast.loading('Loading PDF engine...', { id: loadingToastId });
        
        let pdfModule;
        try {
          pdfModule = await import('@react-pdf/renderer');
          console.log('5a. PDF module loaded');
        } catch (importError) {
          console.error('Failed to import @react-pdf/renderer:', importError);
          toast.dismiss(loadingToastId);
          setIsGeneratingPdf(false);
          throw importError;
        }
        const { pdf } = pdfModule;
        
        // Use the proper InvoiceDocument that supports templates
        console.log('5b. Loading InvoiceDocument');
        toast.loading('Preparing document...', { id: loadingToastId });
        
        let DocumentComponent;
        try {
          const invoiceDocModule = await import('@/features/pdf/InvoiceDocument');
          DocumentComponent = invoiceDocModule.InvoiceDocument;
          console.log('5c. InvoiceDocument loaded');
        } catch (importError) {
          console.error('Failed to import InvoiceDocument:', importError);
          // Fall back to SimpleInvoiceDocument as backup
          const simpleDocModule = await import('@/features/pdf/SimpleInvoiceDocument');
          DocumentComponent = simpleDocModule.SimpleInvoiceDocument;
          console.log('5c. SimpleInvoiceDocument loaded (fallback)');
        }
        
        console.log('6. Creating PDF document');
        toast.loading('Generating PDF... (this may take a moment)', { id: loadingToastId });
        
        // Yield control to the browser before starting heavy work
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Use toBlob() - it's the standard API
        const pdfPromise = pdf(<DocumentComponent invoice={invoiceToUse} template={template} customer={customer} currencySymbol={currencySymbol || '$'} />).toBlob();
        console.log('6c. PDF promise created');
        
        try {
          const pdfBlob = await Promise.race([pdfPromise, timeoutPromise]) as Blob;
          console.log('7. PDF blob created, size:', pdfBlob.size);
          
          const url = URL.createObjectURL(pdfBlob);
          console.log('8. URL created:', url.substring(0, 50) + '...');
          
          toast.dismiss(loadingToastId);
          setIsGeneratingPdf(false);
          
          // Always open PDF in new tab for both mobile and laptop
          try {
            const newWindow = window.open(url, '_blank');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
              // Popup blocked or failed, fallback to download
              const link = document.createElement('a');
              link.href = url;
              link.download = `record-${invoiceToUse.invoiceNumber || 'document'}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success('PDF downloaded (popup was blocked)');
              console.log('9. PDF downloaded (popup blocked)');
            } else {
              toast.success('PDF opened in new tab');
              console.log('9. PDF opened in new tab');
            }
          } catch (windowError) {
            console.error('Error opening PDF:', windowError);
            // Fallback to download
            const link = document.createElement('a');
            link.href = url;
            link.download = `record-${invoiceToUse.invoiceNumber || 'document'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('PDF downloaded');
            console.log('9. PDF downloaded (fallback)');
          }
          
          // Clean up URL object after a delay
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          console.log('10. Cleanup scheduled');
        } catch (raceError) {
          toast.dismiss(loadingToastId);
          setIsGeneratingPdf(false);
          if (raceError instanceof Error && raceError.message.includes('timeout')) {
            console.error('PDF generation timed out after 15 seconds');
            toast.error('PDF generation timed out. The document may be too complex or there may be an issue with images.');
          } else {
            throw raceError;
          }
        }
        
    } catch (error) {
        toast.dismiss(loadingToastId);
        setIsGeneratingPdf(false);
        console.error('Error generating PDF:', error);
        if (error instanceof Error) {
          console.error('Error stack:', error.stack);
        }
        toast.error('Failed to generate PDF');
    }
  };
  

  const handleGoHome = () => {
    if (isDirty && !window.confirm(
      'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
    )) {
      return;
    }
    navigate('/');
  };

  return (
    <AppLayout>
      {loading && <p>Loading record...</p>}
      {error && <p className="text-destructive">Error: {error}</p>}
      {activeInvoice && (
        <div className="space-y-8 pb-20">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold">Record Builder</h1>
                <p className="text-muted-foreground">
                    {activeInvoice.id === 'new'
                        ? 'Creating a new record'
                        : `Editing ${activeInvoice.nickname || `Record ${activeInvoice.invoiceNumber || '#' + activeInvoice.id.substring(0, 8)}`}`
                    }
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
                <span className="sm:hidden">Home</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? 'Generating PDF...' : 'Generate PDF'}
              </Button>
              {id !== 'new' && (
                <Button variant="secondary" onClick={handleSaveAsCopy}>Save as Copy</Button>
              )}
              <Button onClick={handleSave}>Save Record</Button>
            </div>
          </header>
          
          <HeaderForm />
          <LineItemsTable />
        </div>
      )}
    </AppLayout>
  );
}
