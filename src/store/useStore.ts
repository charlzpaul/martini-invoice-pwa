// src/store/useStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as dbApi from '@/db/api';
import { notifyDataChange } from '@/db/events';
import type { Template, Customer, Product, Invoice, GeneratedPDF } from '@/db/models';

// Define a type for the combined feed item
export type FeedItem = (Invoice | Template | GeneratedPDF | Customer | Product) & { itemType: 'Invoice' | 'Template' | 'PDF' | 'Customer' | 'Product' };

interface AppState {
  // State
  templates: Template[];
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  generatedPdfs: GeneratedPDF[];
  feed: FeedItem[];
  hasMore: boolean;
  page: number;
  loading: boolean;
  error: string | null;
  currency: string;
  currencySymbol: string;

  // Actions
  fetchDashboardData: (reset?: boolean) => Promise<void>;
  fetchDashboardMore: () => Promise<void>;
  setCurrency: (currency: string, skipNotify?: boolean) => void;
  // Add actions for creating items will be added later
}

// Helper function to get currency symbol
const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '\u20AC'; // €
    case 'GBP': return '\u00A3'; // £
    case 'JPY': return '\u00A5'; // ¥
    case 'CAD': return 'C$';
    case 'AUD': return 'A$';
    case 'INR': return '\u20B9'; // ₹
    default: return '$';
  }
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      templates: [],
      customers: [],
      products: [],
      invoices: [],
      generatedPdfs: [],
      feed: [],
      hasMore: true,
      page: 1,
      loading: true,
      error: null,
      currency: 'USD',
      currencySymbol: '$',

      // --- Actions ---
      setCurrency: (currency: string, skipNotify = false) => {
        const symbol = getCurrencySymbol(currency);
        set({ currency, currencySymbol: symbol });
        if (!skipNotify) {
          notifyDataChange();
        }
      },
      
      fetchDashboardData: async (reset = false) => {
        const { page, feed: currentFeed } = useStore.getState();
        const currentPage = reset ? 1 : page;
        const ITEMS_PER_PAGE = 15;

        set({ loading: true, error: null });
        try {
          // Fetch all data in parallel
          const [invoices, templates, generatedPdfs, customers, products] = await Promise.all([
            dbApi.getInvoices(),
            dbApi.getTemplates(),
            dbApi.getGeneratedPdfs(),
            dbApi.getCustomers(),
            dbApi.getProducts(),
          ]);

          // Create the combined feed
          const invoiceFeedItems: FeedItem[] = invoices.map(i => ({ ...i, itemType: 'Invoice' }));
          const templateFeedItems: FeedItem[] = templates.map(t => ({ ...t, itemType: 'Template' }));
          const pdfFeedItems: FeedItem[] = generatedPdfs.map(p => ({ ...p, itemType: 'PDF' }));
          const customerFeedItems: FeedItem[] = customers.map(c => ({ ...c, itemType: 'Customer' }));
          const productFeedItems: FeedItem[] = products.map(p => ({ ...p, itemType: 'Product' }));
          
          const allFeed = [...invoiceFeedItems, ...templateFeedItems, ...pdfFeedItems, ...customerFeedItems, ...productFeedItems];

          // Sort helper function
          const sortByDate = (a: any, b: any) => {
            const getDate = (item: any): number => {
              if (item.updatedAt) return new Date(item.updatedAt).getTime();
              if (item.createdAt) return new Date(item.createdAt).getTime();
              return 0;
            };
            return getDate(b) - getDate(a);
          };

          // Sort individual arrays for dropdowns and other uses
          invoices.sort(sortByDate);
          templates.sort(sortByDate);
          customers.sort(sortByDate);
          products.sort(sortByDate);
          generatedPdfs.sort(sortByDate);

          // Sort the feed by date (newest first)
          allFeed.sort(sortByDate);

          const otherFeedItems = allFeed.filter(item => item.itemType !== 'Invoice');
          const invoiceItems = allFeed.filter(item => item.itemType === 'Invoice');

          const endIndex = currentPage * ITEMS_PER_PAGE;
          const paginatedInvoices = invoiceItems.slice(0, endIndex);
          
          let finalFeed: FeedItem[];
          
          if (reset || currentPage === 1) {
            finalFeed = [...paginatedInvoices, ...otherFeedItems];
            finalFeed.sort(sortByDate);
          } else {
            // Find invoices that were NOT in the previous list
            const previousInvoicesCount = (currentPage - 1) * ITEMS_PER_PAGE;
            const newInvoices = invoiceItems.slice(previousInvoicesCount, endIndex);
            finalFeed = [...currentFeed, ...newInvoices];
          }

          const hasMore = invoiceItems.length > endIndex;

          set({
            invoices,
            templates,
            generatedPdfs,
            customers,
            products,
            feed: finalFeed,
            hasMore,
            page: currentPage,
            loading: false,
          });
        } catch (err) {
          console.error("Failed to fetch dashboard data:", err);
          set({ loading: false, error: 'Failed to load data.' });
        }
      },

      fetchDashboardMore: async () => {
        const { loading, hasMore, page, fetchDashboardData } = useStore.getState();
        if (loading || !hasMore) return;
        
        set({ page: page + 1 });
        await fetchDashboardData(false);
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ 
        currency: state.currency, 
        currencySymbol: state.currencySymbol 
      }),
    }
  )
);
