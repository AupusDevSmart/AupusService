// src/features/programacao-os/components/origem-selector/HierarchyBreadcrumb.tsx
import React from 'react';

export interface HierarchyBreadcrumbStep {
  stepNumber: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface HierarchyBreadcrumbProps {
  steps: HierarchyBreadcrumbStep[];
}

/**
 * Componente de breadcrumb visual para navegação hierárquica
 * Mostra o progresso do usuário através dos passos de seleção (Planta → Unidade → Origem)
 */
export const HierarchyBreadcrumb: React.FC<HierarchyBreadcrumbProps> = ({ steps }) => {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {steps.map((step, index) => (
        <React.Fragment key={step.stepNumber}>
          {/* Step circle */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                step.isCompleted
                  ? 'bg-primary text-primary-foreground'
                  : step.isActive
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-muted/50 text-muted-foreground/50'
              }`}
            >
              {step.stepNumber}
            </div>
            <span
              className={`text-xs font-medium ${
                step.isCompleted
                  ? 'text-foreground'
                  : step.isActive
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/50'
              }`}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line (não mostrar depois do último step) */}
          {index < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 transition-colors ${
                step.isCompleted ? 'bg-primary' : 'bg-muted'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
