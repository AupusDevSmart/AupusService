/**
 * Dashboard Grid - Layout responsivo
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Grid responsivo do dashboard
 *
 * - Mobile (< 768px): 1 coluna
 * - Tablet (768px - 1024px): 2 colunas
 * - Desktop (>= 1024px): 4 colunas
 */
export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6',
        className
      )}
    >
      {children}
    </div>
  );
}
