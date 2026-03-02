// src/db/api.ts
import {
  templateStore,
  customerStore,
  productStore,
  invoiceStore,
  pdfStore,
} from './store';
import { notifyDataChange } from './events';
import type { Template, Customer, Product, Invoice, GeneratedPDF } from './models';

/**
 * Generic function to get all items from a store.
 * @param {LocalForage} store - The store instance to query.
 * @returns {Promise<T[]>} - An array of items.
 */
async function getAll<T>(store: LocalForage): Promise<T[]> {
  try {
    const items: T[] = [];
    await store.iterate((value: T) => {
      items.push(value);
    });
    return items;
  } catch (error) {
    console.error('Error in getAll:', error);
    return [];
  }
}

/**
 * Generic function to get an item by key prefix.
 * @param {LocalForage} store - The store instance to query.
 * @param {string} prefix - The key prefix to filter by.
 * @returns {Promise<T | null>} - The item or null if not found.
 */
async function getOneByPrefix<T>(store: LocalForage, prefix: string): Promise<T | null> {
  try {
    let result: T | null = null;
    await store.iterate((value: T, key: string) => {
      if (key.startsWith(prefix)) {
        result = value;
        return true; // Stop iterating
      }
    });
    return result;
  } catch (error) {
    console.error('Error in getOneByPrefix:', error);
    return null;
  }
}

/**
 * Generic function to save an item to a store.
 * It automatically sets a UUID, and created/updated timestamps.
 * @param {LocalForage} store - The store instance.
 * @param {T} item - The item to save. It may or may not have an ID.
 * @returns {Promise<T>} - The saved item with all fields populated.
 */
async function saveItem<T extends { id: string; createdAt?: string; updatedAt?: string; lastSyncedAt?: string }>(
  store: LocalForage,
  item: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncedAt'> & { id?: string; createdAt?: string; updatedAt?: string; lastSyncedAt?: string },
  skipNotify = false
): Promise<T> {
  const now = new Date().toISOString();
  const isNew = !item.id;

  const fullItem: T = {
    id: isNew ? crypto.randomUUID() : item.id,
    ...item,
    createdAt: item.createdAt || (isNew ? now : (await store.getItem<T>(item.id!))?.createdAt || now),
    updatedAt: item.updatedAt || now,
    lastSyncedAt: item.lastSyncedAt,
  } as T;

  await store.setItem(fullItem.id, fullItem);
  if (!skipNotify) {
    notifyDataChange();
  }
  return fullItem;
}

// --- API Functions for Each Model ---

// Templates
export const getTemplates = () => getAll<Template>(templateStore);
export const getTemplateById = (id: string) => templateStore.getItem<Template>(id);
export const saveTemplate = (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncedAt'> & { id?: string; createdAt?: string; updatedAt?: string; lastSyncedAt?: string }, skipNotify = false) => saveItem<Template>(templateStore, template, skipNotify);
export const deleteTemplate = async (id: string, skipNotify = false) => {
  await templateStore.removeItem(id);
  if (!skipNotify) {
    notifyDataChange();
  }
};

// Customers
export const getCustomers = () => getAll<Customer>(customerStore);
export const getCustomerById = (id: string) => customerStore.getItem<Customer>(id);
export const saveCustomer = (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncedAt'> & { id?: string; createdAt?: string; updatedAt?: string; lastSyncedAt?: string }, skipNotify = false) => saveItem<Customer>(customerStore, customer, skipNotify);
export const deleteCustomer = async (id: string, skipNotify = false) => {
  await customerStore.removeItem(id);
  if (!skipNotify) {
    notifyDataChange();
  }
};

// Products
export const getProducts = () => getAll<Product>(productStore);
export const getProductById = (id: string) => productStore.getItem<Product>(id);
export const saveProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncedAt'> & { id?: string; createdAt?: string; updatedAt?: string; lastSyncedAt?: string }, skipNotify = false) => saveItem<Product>(productStore, product, skipNotify);
export const deleteProduct = async (id: string, skipNotify = false) => {
  await productStore.removeItem(id);
  if (!skipNotify) {
    notifyDataChange();
  }
};

// Invoices
export const getInvoices = () => getAll<Invoice>(invoiceStore);
export const getInvoiceById = (id: string) => invoiceStore.getItem<Invoice>(id);
export const saveInvoice = (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncedAt'> & { id?: string; createdAt?: string; updatedAt?: string; lastSyncedAt?: string }, skipNotify = false) => saveItem<Invoice>(invoiceStore, invoice, skipNotify);
export const deleteInvoice = async (id: string, skipNotify = false) => {
  await invoiceStore.removeItem(id);
  if (!skipNotify) {
    notifyDataChange();
  }
};

// Generated PDFs
export const getGeneratedPdfs = () => getAll<GeneratedPDF>(pdfStore);
export const getGeneratedPdfById = (id: string) => pdfStore.getItem<GeneratedPDF>(id);

export const getGeneratedPdfByInvoiceId = async (invoiceId: string): Promise<GeneratedPDF | null> => {
  return getOneByPrefix(pdfStore, `pdf_${invoiceId}_`);
};

export const saveGeneratedPdf = (pdf: Omit<GeneratedPDF, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncedAt'> & { id?: string; createdAt?: string; updatedAt?: string; lastSyncedAt?: string }, skipNotify = false) => saveItem<GeneratedPDF>(pdfStore, pdf, skipNotify);
export const deleteGeneratedPdf = async (id: string, skipNotify = false) => {
  await pdfStore.removeItem(id);
  if (!skipNotify) {
    notifyDataChange();
  }
};

// --- Sync Utils ---
export const clearAllLastSyncedAt = async () => {
  const clearStore = async (store: LocalForage) => {
    const items: any[] = [];
    await store.iterate((value: any) => {
      items.push({ ...value, lastSyncedAt: undefined });
    });
    for (const item of items) {
      await store.setItem(item.id, item);
    }
  };

  await Promise.all([
    clearStore(templateStore),
    clearStore(customerStore),
    clearStore(productStore),
    clearStore(invoiceStore),
  ]);
  notifyDataChange();
};
