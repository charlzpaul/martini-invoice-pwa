// src/features/template-builder/store/useTemplateStore.ts
import { create } from 'zustand';
import type { Template } from '@/db/models';
import * as dbApi from '@/db/api';
import { notifyDataChange } from '@/features/sync/hooks/useDataSync';

interface TemplateState {
  // The original template, as it exists in the database.
  originalTemplate: Template | null;
  // The working copy of the template that the user is editing.
  activeTemplate: Template | null;
  // ID of the currently selected canvas item (image or label).
  selectedItemId: string | null;
  
  loading: boolean;
  error: string | null;
  isDirty: boolean;

  // --- Actions ---
  loadTemplate: (id: string) => Promise<void>;
  createNewTemplate: () => void;
  updateActiveTemplate: (data: Partial<Template>) => void;
  saveTemplate: () => Promise<any>;
  saveAsCopy: () => Promise<any>;
  setSelectedItemId: (id: string | null) => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  originalTemplate: null,
  activeTemplate: null,
  selectedItemId: null,
  loading: false,
  error: null,
  isDirty: false,

  loadTemplate: async (id: string) => {
    set({ loading: true, error: null, originalTemplate: null, activeTemplate: null, selectedItemId: null, isDirty: false });
    try {
      const template = await dbApi.getTemplateById(id);
      if (template) {
        set({
          originalTemplate: template,
          activeTemplate: structuredClone(template),
          loading: false,
          isDirty: false,
        });
      } else {
        throw new Error(`Template with id "${id}" not found.`);
      }
    } catch (err) {
      console.error(err);
      set({ loading: false, error: (err as Error).message });
    }
  },

  createNewTemplate: () => {
    const now = new Date().toISOString();
    const newTemplate: Template = {
      id: 'new', // Temporary ID
      name: 'Untitled Template',
      paperSize: 'A4',
      images: [],
      labels: [
        {
          id: 'invoice-number',
          type: 'Custom',
          textValue: 'Invoice #: INV-2023-001',
          isVisible: true,
          x: 50,
          y: 100,
          fontSize: 14,
          fontFamily: 'Arial',
          width: 200,
          height: 30,
        },
        {
          id: 'date-block',
          type: 'Custom',
          textValue: 'Date: January 1, 2023',
          isVisible: true,
          x: 50,
          y: 130,
          fontSize: 14,
          fontFamily: 'Arial',
          width: 200,
          height: 30,
        },
        {
          id: 'customer-info',
          type: 'Custom',
          textValue: 'John Doe\n123 Main St, City, State 12345\nPhone: (555) 123-4567\nTax ID: 123-45-6789',
          isVisible: true,
          x: 50,
          y: 170,
          fontSize: 12,
          fontFamily: 'Arial',
          width: 200,
          height: 80,
        },
        {
          id: 'totals-block',
          type: 'Custom',
          textValue: 'Subtotal: $0.00\nTax 1 (10%): $0.00\nTax 2 (5%): $0.00\nTotal: $0.00',
          isVisible: true,
          x: 300,
          y: 400,
          fontSize: 12,
          fontFamily: 'Arial',
          width: 200,
          height: 100,
        }
      ],
      lineItemArea: { y: 250, height: 400 },
      createdAt: now,
      updatedAt: now,
    };
    set({
      originalTemplate: null, // No original, it's new
      activeTemplate: newTemplate,
      loading: false,
      error: null,
      isDirty: false,
    });
  },

  updateActiveTemplate: (data: Partial<Template>) => {
    set((state) => {
      if (!state.activeTemplate) {
        return { activeTemplate: null };
      }
      const newTemplate = { ...state.activeTemplate, ...data, updatedAt: new Date().toISOString() };
      const isDirty = state.originalTemplate
        ? JSON.stringify(state.originalTemplate) !== JSON.stringify(newTemplate)
        : true; // If there's no original (new template), any change makes it dirty
      return {
        activeTemplate: newTemplate,
        isDirty,
      };
    });
  },

  saveTemplate: async () => {
    const { activeTemplate } = get();
    if (!activeTemplate) return;

    set({ loading: true });
    try {
      const isNew = activeTemplate.id === 'new';
      const payload = { ...activeTemplate };
      if (isNew) {
        const { id: _id, ...rest } = payload;
        const savedTemplate = await dbApi.saveTemplate(rest);
        set({ originalTemplate: savedTemplate, activeTemplate: savedTemplate, loading: false, isDirty: false });
        notifyDataChange();
        return savedTemplate;
      } else {
        const savedTemplate = await dbApi.saveTemplate(payload);
        set({ originalTemplate: savedTemplate, activeTemplate: savedTemplate, loading: false, isDirty: false });
        notifyDataChange();
        return savedTemplate;
      }
    } catch (err) {
      console.error(err);
      set({ loading: false, error: 'Failed to save template.' });
      throw err;
    }
  },

  saveAsCopy: async () => {
    const { activeTemplate } = get();
    if (!activeTemplate) return;

    set({ loading: true });
    try {
      const { id: _id, ...rest } = activeTemplate;
      const newName = `${rest.name} (Copy)`;
      const savedTemplate = await dbApi.saveTemplate({ ...rest, name: newName });
      set({ originalTemplate: savedTemplate, activeTemplate: savedTemplate, loading: false, isDirty: false });
      notifyDataChange();
      return savedTemplate;
    } catch (err) {
      console.error(err);
      set({ loading: false, error: 'Failed to save copy.' });
      throw err;
    }
  },

  setSelectedItemId: (id: string | null) => {
    set({ selectedItemId: id });
  },
}));
