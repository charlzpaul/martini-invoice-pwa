// src/features/pdf/generatePdf.ts
import type { Invoice, Template, GeneratedPDF } from '@/db/models';
import * as dbApi from '@/db/api';
import { pdf } from '@react-pdf/renderer';
import { InvoiceDocument } from './InvoiceDocument';

export async function generatePdfForInvoice(
    invoice: Invoice,
    template: Template
): Promise<Blob> {
    // Load customer data before generating PDF
    let customer = null;
    if (invoice.customerId) {
        customer = await dbApi.getCustomerById(invoice.customerId);
    }
    
    const pdfBlob = await pdf(<InvoiceDocument invoice={invoice} template={template} customer={customer} />).toBlob();
    return pdfBlob;
}

export async function saveGeneratedPdfForInvoice(
    invoice: Invoice,
    template: Template
): Promise<GeneratedPDF> {
    const pdfBlob = await generatePdfForInvoice(invoice, template);

    const newPdf: Omit<GeneratedPDF, 'id' | 'createdAt' | 'updatedAt'> = {
        invoiceId: invoice.id,
        blob: pdfBlob,
        generatedAt: new Date().toISOString(),
    };

    const savedPdf = await dbApi.saveGeneratedPdf(newPdf);
    return savedPdf;
}
