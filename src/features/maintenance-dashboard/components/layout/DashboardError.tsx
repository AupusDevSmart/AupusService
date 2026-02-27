/**
 * Dashboard Error - Error state
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DashboardErrorProps {
  error: Error | null;
  onRetry?: () => void;
}

/**
 * Estado de erro do dashboard
 */
export function DashboardError({ error, onRetry }: DashboardErrorProps) {
  return (
    <div className="h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dashboard</AlertTitle>
          <AlertDescription className="mt-2">
            {error?.message || 'Ocorreu um erro desconhecido'}
          </AlertDescription>
        </Alert>

        {onRetry && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={onRetry}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        )}
      </div>
    </div>
  );
}
