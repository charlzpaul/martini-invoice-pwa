// src/features/pdf/generatePdf.ts
import type { Invoice, Template, GeneratedPDF } from '@/db/models';
import * as dbApi from '@/db/api';

export async function generatePdfForInvoice(
    invoice: Invoice,
    template: Template,
    currencySymbol: string = '$'
): Promise<Blob> {
    // Dynamically import react-pdf renderer and InvoiceDocument to avoid static imports
    const { pdf } = await import('@react-pdf/renderer');
    const { InvoiceDocument } = await import('./InvoiceDocument');

    // Load customer data before generating PDF
    let customer = null;
    if (invoice.customerId) {
        customer = await dbApi.getCustomerById(invoice.customerId);
    }
    
    const pdfBlob = await pdf(<InvoiceDocument invoice={invoice} template={template} customer={customer} currencySymbol={currencySymbol} />).toBlob();
    return pdfBlob;
}

export async function saveGeneratedPdfForInvoice(
    invoice: Invoice,
    template: Template,
    currencySymbol: string = '$'
): Promise<GeneratedPDF> {
    const pdfBlob = await generatePdfForInvoice(invoice, template, currencySymbol);

    const newPdf: Omit<GeneratedPDF, 'id' | 'createdAt' | 'updatedAt'> = {
        invoiceId: invoice.id,
        blob: pdfBlob,
        generatedAt: new Date().toISOString(),
    };

    const savedPdf = await dbApi.saveGeneratedPdf(newPdf);
    return savedPdf;
}
