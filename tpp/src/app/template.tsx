'use client';

import React from 'react';
import { MainLayout } from '@/components/shared/MainLayout';

/**
 * Template component that wraps all pages with the MainLayout
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}