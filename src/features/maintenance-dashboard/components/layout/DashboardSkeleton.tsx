/**
 * Dashboard Skeleton - Loading state
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Estado de loading do dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* KPI Cards */}
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-40" />
            </Card>
          ))}

          {/* Charts */}
          <Card className="col-span-1 md:col-span-2 p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </Card>

          <Card className="col-span-1 md:col-span-2 p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </Card>

          {/* Panels */}
          <Card className="col-span-1 md:col-span-2 p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>

          <Card className="col-span-1 md:col-span-2 p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
