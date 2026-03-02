// src/db/seed-large.ts
import {
  customerStore,
  productStore,
  invoiceStore,
} from './store';
import type { Customer, Product, Invoice } from './models';

/**
 * Generates a large number of items for testing pagination.
 */
export async function seedLargeData() {
  const now = new Date();
  
  console.log('Seeding large dataset for pagination testing...');

  for (let i = 1; i <= 50; i++) {
    const timestamp = new Date(now.getTime() - i * 3600000).toISOString(); // Each item 1 hour older
    
    // Seed Customer
    const customerId = crypto.randomUUID();
    const customer: Customer = {
      id: customerId,
      name: `Test Customer ${i}`,
      email: `test${i}@example.com`,
      address: `${i} Test St, Test City`,
      phone: `555-000-${i.toString().padStart(4, '0')}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await customerStore.setItem(customerId, customer);

    // Seed Product
    const productId = crypto.randomUUID();
    const product: Product = {
      id: productId,
      name: `Test Product ${i}`,
      defaultRate: 10 * i,
      defaultQuantity: 1,
      unit: 'item',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await productStore.setItem(productId, product);

    // Seed Invoice
    const invoiceId = crypto.randomUUID();
    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber: `INV-${2023000 + i}`,
      nickname: `Test Invoice ${i}`,
      customerId: customerId,
      templateId: 'default-template-id',
      date: timestamp,
      lineItems: [
        { id: crypto.randomUUID(), itemName: `Item ${i}`, qty: 1, rate: 10 * i, amount: 10 * i },
      ],
      appliedFees: {},
      subtotal: 10 * i,
      taxAmount: 0,
      grandTotal: 10 * i,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await invoiceStore.setItem(invoiceId, invoice);
  }

  console.log('Large dataset seeding complete (50 customers, 50 products, 50 invoices).');
}
