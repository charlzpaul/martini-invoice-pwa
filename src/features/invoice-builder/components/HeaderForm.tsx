// src/features/invoice-builder/components/HeaderForm.tsx
import { useStore } from '@/store/useStore';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { useEffect } from 'react';
import { format } from "date-fns"

export function HeaderForm() {
  const { customers, templates, fetchDashboardData } = useStore();
  const { activeInvoice, updateActiveInvoice } = useInvoiceStore();

  useEffect(() => {
    // Ensure customers and templates are loaded
    if (customers.length === 0 || templates.length === 0) {
      fetchDashboardData();
    }
  }, [customers.length, templates.length, fetchDashboardData]);

  if (!activeInvoice) return null;

  return (
    <div className="p-4 border rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
      {/* Nickname */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Nickname</label>
        <Input
          placeholder="My Invoice"
          value={activeInvoice.nickname || ''}
          onChange={(e) => updateActiveInvoice({ nickname: e.target.value })}
        />
      </div>

      {/* Invoice Number (Read-only) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Invoice Number</label>
        <Input
          placeholder="Auto-generated"
          value={activeInvoice.invoiceNumber || ''}
          readOnly
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">Auto-generated when saved</p>
      </div>

      {/* Customer Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Customer</label>
        <Select
          value={activeInvoice.customerId}
          onValueChange={(value) => updateActiveInvoice({ customerId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select customer..." />
          </SelectTrigger>
          <SelectContent>
            {customers.map(customer => (
              <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Template Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Template</label>
        <Select
          value={activeInvoice.templateId}
          onValueChange={(value) => updateActiveInvoice({ templateId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map(template => (
              <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Invoice Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !activeInvoice.date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {activeInvoice.date ? format(new Date(activeInvoice.date), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={new Date(activeInvoice.date)}
              onSelect={(date) => updateActiveInvoice({ date: date?.toISOString() || '' })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
