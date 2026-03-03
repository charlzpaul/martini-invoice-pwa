import React from 'react';
import { Page, Text, Document, StyleSheet } from '@react-pdf/renderer';
import type { Invoice, Template, Customer } from '@/db/models';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: 'white',
  },
});

interface SimpleInvoiceDocumentProps {
  invoice: Invoice;
  template: Template;
  customer?: Customer | null;
}

export const SimpleInvoiceDocument: React.FC<SimpleInvoiceDocumentProps> = ({ invoice }) => {
  const paperSize = (invoice.templateId ? 'A4' : 'A4') as 'A4' | 'LETTER';
  
  return (
    <Document>
      <Page size={paperSize} style={styles.page}>
        <Text>Test Record</Text>
        <Text>Record Number: {invoice.invoiceNumber || 'N/A'}</Text>
        <Text>Total: ${invoice.grandTotal.toFixed(2)}</Text>
      </Page>
    </Document>
  );
};