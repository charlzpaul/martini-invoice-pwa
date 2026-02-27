// src/features/invoice-builder/components/LineItemsTable.tsx
import { useInvoiceStore } from '../store/useInvoiceStore';
import { useStore } from '@/store/useStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from 'lucide-react';
import type { LineItem } from '@/db/models';

export function LineItemsTable() {
  const { activeInvoice, setLineItems } = useInvoiceStore();
  const products = useStore((state) => state.products);
  const currencySymbol = useStore((state) => state.currencySymbol);

  if (!activeInvoice) return null;

  const handleLineItemChange = (id: string, field: keyof LineItem, value: string | number) => {
    const updatedLineItems = activeInvoice.lineItems.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        // Recalculate amount if rate or qty changes
        if (field === 'qty' || field === 'rate') {
            const qty = field === 'qty' ? Number(value) || 0 : Number(newItem.qty) || 0;
            const rate = field === 'rate' ? Number(value) || 0 : Number(newItem.rate) || 0;
            newItem.amount = qty * rate;
        }
        return newItem;
      }
      return item;
    });
    setLineItems(updatedLineItems);
  };

  const handleProductSelect = (id: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const defaultRate = Number(product.defaultRate) || 0;
    const defaultQuantity = Number(product.defaultQuantity) || 1;

    const updatedLineItems = activeInvoice.lineItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          itemName: product.name,
          rate: defaultRate,
          qty: defaultQuantity,
          amount: defaultRate * defaultQuantity
        };
      }
      return item;
    });
    setLineItems(updatedLineItems);
  };

  const addLineItem = () => {
    const newLineItem: LineItem = {
      id: `item-${crypto.randomUUID()}`,
      itemName: '',
      qty: 1,
      rate: 0,
      amount: 0,
    };
    setLineItems([...activeInvoice.lineItems, newLineItem]);
  };

  const removeLineItem = (id: string) => {
    const updatedLineItems = activeInvoice.lineItems.filter(item => item.id !== id);
    setLineItems(updatedLineItems);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="min-w-full inline-block align-middle">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px] sm:min-w-[150px] md:min-w-[200px] sm:w-[50%]">Item</TableHead>
                <TableHead className="min-w-[70px] sm:min-w-[80px]">Qty</TableHead>
                <TableHead className="min-w-[70px] sm:min-w-[80px]">Rate</TableHead>
                <TableHead className="min-w-[80px] sm:min-w-[100px] text-right">Amount</TableHead>
                <TableHead className="min-w-[40px] sm:min-w-[50px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeInvoice.lineItems.map(item => (
                <TableRow key={item.id} data-testid="line-item-row">
                  <TableCell className="py-2 sm:py-3">
                    <div className="flex flex-col gap-2">
                      <Select
                        value={item.itemName}
                        onValueChange={(value) => {
                          if (value === 'custom') {
                            // Keep custom input
                          } else {
                            handleProductSelect(item.id, value);
                          }
                        }}
                      >
                        <SelectTrigger className="min-w-[100px] sm:min-w-[150px] text-sm sm:text-base">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom item...</SelectItem>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({currencySymbol}{product.defaultRate}/{product.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={item.itemName}
                        onChange={(e) => handleLineItemChange(item.id, 'itemName', e.target.value)}
                        placeholder="Or type custom item name"
                        className="min-w-[100px] sm:min-w-[150px] text-sm sm:text-base"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="py-2 sm:py-3">
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={(e) => handleLineItemChange(item.id, 'qty', Number(e.target.value))}
                      className="min-w-[60px] sm:min-w-[80px] text-sm sm:text-base"
                    />
                  </TableCell>
                  <TableCell className="py-2 sm:py-3">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleLineItemChange(item.id, 'rate', Number(e.target.value))}
                        className="min-w-[60px] sm:min-w-[80px] text-sm sm:text-base"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {(() => {
                          const product = products.find(p => p.name === item.itemName);
                          return product ? `/${product.unit}` : '';
                        })()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 sm:py-3 text-right font-medium">
                    {currencySymbol}{item.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="py-2 sm:py-3 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                      className="h-8 w-8 sm:h-9 sm:w-9"
                      aria-label="Delete item"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <Button onClick={addLineItem} variant="outline" className="w-full sm:w-auto">Add Line Item</Button>

        <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{currencySymbol}{activeInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span>{currencySymbol}{activeInvoice.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total</span>
                    <span>{currencySymbol}{activeInvoice.grandTotal.toFixed(2)}</span>
                </div>
            </div>
      </div>
    </div>
  );
}
