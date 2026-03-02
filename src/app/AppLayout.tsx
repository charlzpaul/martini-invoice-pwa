// src/app/AppLayout.tsx
import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { GoogleAuth } from '@/features/sync/GoogleAuth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-4 px-4 sm:px-8 border-b">
        <div className="flex justify-end max-w-7xl mx-auto">
          <GoogleAuth />
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
