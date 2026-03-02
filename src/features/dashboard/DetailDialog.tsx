// src/features/dashboard/DetailDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { User, Package, Calendar, Mail, Phone, MapPin, DollarSign, Tag } from 'lucide-react';
import type { Customer, Product } from '@/db/models';
import { useStore } from '@/store/useStore';

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'Customer' | 'Product';
  data: Customer | Product | null;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function DetailDialog({ open, onOpenChange, type, data }: DetailDialogProps) {
  const currencySymbol = useStore((state) => state.currencySymbol);
  
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'Customer' ? (
              <>
                <User className="h-5 w-5 text-green-600" />
                Customer Details
              </>
            ) : (
              <>
                <Package className="h-5 w-5 text-blue-600" />
                Product Details
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this {type.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {type === 'Customer' ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{(data as Customer).name}</h3>
                  <Badge variant="outline" className="text-xs">
                    Customer ID: {(data as Customer).id.substring(0, 8)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <a 
                      href={`mailto:${(data as Customer).email}`}
                      className="text-primary hover:underline"
                    >
                      {(data as Customer).email}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>
                    <span>{(data as Customer).phone}</span>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="font-medium">Address:</span>
                      <p className="text-muted-foreground whitespace-pre-wrap">{(data as Customer).address}</p>
                    </div>
                  </div>

                  {(data as Customer).taxId && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Tax ID:</span>
                      <span>{(data as Customer).taxId}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{(data as Product).name}</h3>
                  <Badge variant="outline" className="text-xs">
                    Product ID: {(data as Product).id.substring(0, 8)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Default Rate:</span>
                    <span className="font-semibold">
                      {currencySymbol}{(data as Product).defaultRate.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                      per {(data as Product).unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Unit:</span>
                    <Badge variant="secondary" className="capitalize">
                      {(data as Product).unit}
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Created:</span>
              <span>{formatDate(data.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Last Updated:</span>
              <span>{formatDate(data.updatedAt)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}