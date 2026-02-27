/**
 * Dashboard Section - Seção com título
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardSectionProps {
  title?: string;
  children: React.ReactNode;
  gridCols?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Seção do dashboard com título opcional
 *
 * Permite definir quantas colunas essa seção deve ocupar
 * no grid pai
 */
export function DashboardSection({
  title,
  children,
  gridCols = 1,
  className,
}: DashboardSectionProps) {
  const colSpanClass = {
    1: 'col-span-1',
    2: 'col-span-1 md:col-span-2',
    3: 'col-span-1 md:col-span-2 lg:col-span-3',
    4: 'col-span-1 md:col-span-2 lg:col-span-4',
  }[gridCols];

  return (
    <div className={cn(colSpanClass, className)}>
      {title && (
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          {title}
        </h2>
      )}
      <div
        className={cn(
          'grid gap-4',
          gridCols === 1 && 'grid-cols-1',
          gridCols === 2 && 'grid-cols-1 md:grid-cols-2',
          gridCols === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          gridCols === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        )}
      >
        {children}
      </div>
    </div>
  );
}
