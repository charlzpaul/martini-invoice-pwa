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
import { TypeableSelect } from '@/components/ui/typeable-select';
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { useEffect, useState } from 'react';
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import * as dbApi from '@/db/api';

export function HeaderForm() {
  const { customers, templates, fetchDashboardData } = useStore();
  const { activeInvoice, updateActiveInvoice } = useInvoiceStore();
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    taxId: ''
  });

  useEffect(() => {
    // Ensure customers and templates are loaded
    if (customers.length === 0 || templates.length === 0) {
      fetchDashboardData();
    }
  }, [customers.length, templates.length, fetchDashboardData]);

  const handleAddCustomer = async () => {
    try {
      if (!newCustomerForm.name.trim()) {
        toast.error('Validation Error', { description: 'Customer name is required' });
        return;
      }

      const newCustomer = await dbApi.saveCustomer({
        name: newCustomerForm.name.trim(),
        address: newCustomerForm.address.trim(),
        email: newCustomerForm.email.trim(),
        phone: newCustomerForm.phone.trim(),
        taxId: newCustomerForm.taxId.trim() || undefined
      });

      toast.success('Customer Added', { description: `${newCustomerForm.name} has been added successfully` });
      
      // Reset form
      setNewCustomerForm({
        name: '',
        address: '',
        email: '',
        phone: '',
        taxId: ''
      });
      
      setCustomerDialogOpen(false);
      
      // Refresh dashboard data
      fetchDashboardData();

      // Select the newly added customer
      if (newCustomer?.id) {
        updateActiveInvoice({ customerId: newCustomer.id });
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Error', { description: 'Failed to add customer' });
    }
  };

  if (!activeInvoice) return null;

  // Prepare customer options for TypeableSelect
  const customerOptions = customers.map(customer => ({
    id: customer.id,
    label: customer.name,
    value: customer.id,
    description: customer.email || customer.phone ? `${customer.email || ''} ${customer.phone || ''}`.trim() : undefined
  }));

  // Prepare template options for TypeableSelect
  const templateOptions = templates.map(template => ({
    id: template.id,
    label: template.name,
    value: template.id,
    description: undefined
  }));

  return (
    <>
      <div className="p-4 border rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Nickname */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Nickname</label>
          <Input
            placeholder="My Record"
            value={activeInvoice.nickname || ''}
            onChange={(e) => updateActiveInvoice({ nickname: e.target.value })}
          />
        </div>

        {/* Record Number (Read-only) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Record Number</label>
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
          <TypeableSelect
            options={customerOptions}
            value={activeInvoice.customerId}
            onValueChange={(value) => updateActiveInvoice({ customerId: value })}
            placeholder="Select customer..."
            searchPlaceholder="Search customers..."
            emptyMessage="No customers found."
            showAddNew={true}
            onAddNew={() => setCustomerDialogOpen(true)}
            addNewLabel="Add new customer"
          />
        </div>

        {/* Template Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Template</label>
          <TypeableSelect
            options={templateOptions}
            value={activeInvoice.templateId}
            onValueChange={(value) => updateActiveInvoice({ templateId: value })}
            placeholder="Select a template..."
            searchPlaceholder="Search templates..."
            emptyMessage="No templates found."
          />
        </div>

        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Record Date</label>
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

      {/* Add Customer Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name *</Label>
              <Input
                id="customer-name"
                value={newCustomerForm.name}
                onChange={(e) => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Address</Label>
              <Textarea
                id="customer-address"
                value={newCustomerForm.address}
                onChange={(e) => setNewCustomerForm({...newCustomerForm, address: e.target.value})}
                placeholder="Customer address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={newCustomerForm.email}
                onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                placeholder="customer@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-taxId">Tax ID</Label>
              <Input
                id="customer-taxId"
                value={newCustomerForm.taxId}
                onChange={(e) => setNewCustomerForm({...newCustomerForm, taxId: e.target.value})}
                placeholder="Tax identification number"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCustomerDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCustomer}>
                Add Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
