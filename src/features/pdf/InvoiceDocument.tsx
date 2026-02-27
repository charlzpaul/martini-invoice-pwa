import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { Invoice, Template, Customer, CanvasLabel, LineItem } from '@/db/models';

// Helper function to get react-pdf compatible font family
// TEMPORARY: Always return Helvetica to debug hanging issue
function getPdfFontFamily(_fontFamily?: string): string {
  return 'Helvetica';
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: 'white',
  },
  // Use absolute positioning for canvas elements
  canvasObject: {
    position: 'absolute',
  },
  lineItemTable: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#dfdfdf',
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#dfdfdf',
    backgroundColor: '#f2f2f2',
    padding: 5,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#dfdfdf',
    padding: 5,
  },
});

function getLabelValue(label: CanvasLabel, invoice: Invoice, customer?: Customer | null): string {
  switch (label.type) {
    case 'Subtotal':
      return `Subtotal: $${invoice.subtotal.toFixed(2)}`;
    case 'Tax':
      return `Tax: $${invoice.taxAmount.toFixed(2)}`;
    case 'Total':
      return `Total: $${invoice.grandTotal.toFixed(2)}`;
    default:
      let text = label.textValue;
      
      // Replace invoice number placeholder
      if (text.includes('INV-2023-001') && invoice.invoiceNumber) {
        text = text.replace('INV-2023-001', invoice.invoiceNumber);
      }
      
      // Replace date placeholder
      if (text.includes('January 1, 2023') && invoice.date) {
        const dateObj = new Date(invoice.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        text = text.replace('January 1, 2023', formattedDate);
      }
      
      // Replace customer info placeholder
      if (customer && text.includes('John Doe')) {
        const customerText = `${customer.name}\n${customer.address}\nPhone: ${customer.phone}\nTax ID: ${customer.taxId || 'N/A'}`;
        text = customerText;
      }
      
      // Replace totals placeholder
      if (text.includes('Subtotal: $0.00')) {
        text = text.replace('Subtotal: $0.00', `Subtotal: $${invoice.subtotal.toFixed(2)}`);
      }
      // Replace tax placeholders
      if (text.includes('Tax 1 (10%): $0.00')) {
        // For simplicity, use half of taxAmount for each tax line
        const tax1Amount = invoice.taxAmount / 2;
        text = text.replace('Tax 1 (10%): $0.00', `Tax 1 (10%): $${tax1Amount.toFixed(2)}`);
      }
      if (text.includes('Tax 2 (5%): $0.00')) {
        const tax2Amount = invoice.taxAmount / 2;
        text = text.replace('Tax 2 (5%): $0.00', `Tax 2 (5%): $${tax2Amount.toFixed(2)}`);
      }
      if (text.includes('Total: $0.00')) {
        text = text.replace('Total: $0.00', `Total: $${invoice.grandTotal.toFixed(2)}`);
      }
      
      return text;
  }
}

interface InvoiceDocumentProps {
  invoice: Invoice;
  template: Template;
  customer?: Customer | null;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice, template, customer }) => {
  const paperSize = (template.paperSize === 'Letter' ? 'LETTER' : 'A4') as 'A4' | 'LETTER';
  
  // Page dimensions in points (react-pdf units)
  const pageWidth = paperSize === 'A4' ? 595 : 612;
  const pageHeight = paperSize === 'A4' ? 842 : 792;
  
  // Convert pixel to point (approximate: 1px = 0.75pt at 96 DPI)
  const pxToPt = 0.75;

  return (
    <Document>
      <Page size={paperSize} style={styles.page}>
                {/* Static Content: Images and Labels */}
                {template.images.map(image => {
                  // Convert pixel dimensions to points
                  let width = Math.max(1, image.currentWidth * pxToPt);
                  let height = Math.max(1, image.currentHeight * pxToPt);
                  let left = image.x * pxToPt + 40; // Add page padding
                  let top = image.y * pxToPt + 40; // Add page padding
                   
                  // Calculate available space within page (accounting for 40pt padding on all sides)
                  const maxRight = pageWidth - 40;
                  const maxBottom = pageHeight - 40;
                   
                  // Ensure image stays within page bounds - adjust position if needed
                  if (left < 40) left = 40;
                  if (top < 40) top = 40;
                  if (left > maxRight) left = maxRight - width;
                  if (top > maxBottom) top = maxBottom - height;
                   
                  // Calculate how much the image exceeds page bounds
                  const excessRight = Math.max(0, left + width - maxRight);
                  const excessBottom = Math.max(0, top + height - maxBottom);
                   
                  // If image exceeds bounds, scale it down proportionally
                  if (excessRight > 0 || excessBottom > 0) {
                    // Calculate scaling factors for width and height
                    // Ensure we don't divide by zero and scale is positive
                    const widthScale = excessRight > 0 && width > 0 ? Math.max(0.01, (maxRight - left) / width) : 1;
                    const heightScale = excessBottom > 0 && height > 0 ? Math.max(0.01, (maxBottom - top) / height) : 1;
                    
                    // Use the more restrictive scale to maintain aspect ratio
                    const scale = Math.min(widthScale, heightScale, 1); // Don't scale up
                    
                    // Apply scaling
                    width = Math.max(1, width * scale);
                    height = Math.max(1, height * scale);
                  }
                  
                  return (
                    <React.Fragment key={image.id}>
                      <Image
                          src={image.base64Data}
                          style={{
                              ...styles.canvasObject,
                              left,
                              top,
                              width,
                              height,
                              opacity: image.opacity,
                          }}
                      />
                    </React.Fragment>
                  );
                })}
                {template.labels.filter(l => l.isVisible).map(label => {
                  // Convert pixel position to points and adjust for padding
                  let left = label.x * pxToPt + 40;
                  let top = label.y * pxToPt + 40;
                  
                  // Ensure label stays within page bounds
                  if (left < 40) left = 40;
                  if (top < 40) top = 40;
                  if (left > pageWidth - 40) left = pageWidth - 40;
                  if (top > pageHeight - 40) top = pageHeight - 40;
                  
                  return (
                    <React.Fragment key={label.id}>
                      <Text
                          style={{
                              ...styles.canvasObject,
                              left,
                              top,
                              fontSize: label.fontSize,
                              fontFamily: getPdfFontFamily(label.fontFamily),
                          }}
                      >
                          {getLabelValue(label, invoice, customer)}
                      </Text>
                    </React.Fragment>
                  );
                })}

                {/* Dynamic Content: Line Items */}
                <View style={{
                    position: 'absolute',
                    left: 40, // Match page padding
                    right: 40, // Match page padding
                    top: template.lineItemArea.y * pxToPt + 40, // Convert pixels to points and add page padding
                    height: template.lineItemArea.height * pxToPt,
                }}>
                    <View style={styles.lineItemTable}>
                        {/* Header */}
                        <View style={styles.tableRow}>
                            <Text style={{...styles.tableColHeader, width: '40%'}}>Item</Text>
                            <Text style={styles.tableColHeader}>Quantity</Text>
                            <Text style={styles.tableColHeader}>Rate</Text>
                            <Text style={styles.tableColHeader}>Amount</Text>
                        </View>
                        {/* Rows */}
                        {invoice.lineItems.map((item: LineItem) => (
                            <React.Fragment key={item.id}>
                              <View style={styles.tableRow}>
                                  <Text style={{...styles.tableCol, width: '40%'}}>{item.itemName}</Text>
                                  <Text style={styles.tableCol}>{item.qty}</Text>
                                  <Text style={styles.tableCol}>${item.rate.toFixed(2)}</Text>
                                  <Text style={styles.tableCol}>${item.amount.toFixed(2)}</Text>
                              </View>
                            </React.Fragment>
                        ))}
                    </View>
                </View>

           </Page>
        </Document>
    );
};
