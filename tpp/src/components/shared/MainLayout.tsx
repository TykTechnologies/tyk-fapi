'use client';

import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * Main layout component that includes header and footer
 */
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}