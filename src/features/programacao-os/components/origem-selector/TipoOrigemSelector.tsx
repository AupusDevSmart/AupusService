// src/features/programacao-os/components/origem-selector/TipoOrigemSelector.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings, FilePenLine, FileText } from 'lucide-react';
import { TipoOrigem } from './types';

interface TipoOrigemSelectorProps {
  value: TipoOrigem;
  onChange: (tipo: TipoOrigem) => void;
  disabled?: boolean;
}

/**
 * Componente para seleção do tipo de origem da ordem de serviço
 * Opções: Anomalia, Plano de Manutenção, Solicitação de Serviço ou Manual
 */
export const TipoOrigemSelector: React.FC<TipoOrigemSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Anomalia */}
      <Button
        type="button"
        variant={value === 'ANOMALIA' ? 'default' : 'outline'}
        className={`h-24 flex-col gap-2 relative transition-all duration-200 ${
          value === 'ANOMALIA'
            ? 'ring-2 ring-primary ring-offset-2 bg-primary hover:bg-primary/90'
            : 'hover:border-primary/50 hover:bg-primary/5'
        }`}
        onClick={() => onChange('ANOMALIA')}
        disabled={disabled}
      >
        <AlertTriangle className={`h-6 w-6 ${value === 'ANOMALIA' ? 'text-primary-foreground' : 'text-destructive'}`} />
        <span className="text-xs font-medium">Anomalia</span>
        <span className="text-[10px] opacity-70">Problema detectado</span>
      </Button>

      {/* Plano de Manutenção */}
      <Button
        type="button"
        variant={value === 'PLANO_MANUTENCAO' ? 'default' : 'outline'}
        className={`h-24 flex-col gap-2 relative transition-all duration-200 ${
          value === 'PLANO_MANUTENCAO'
            ? 'ring-2 ring-primary ring-offset-2 bg-primary hover:bg-primary/90'
            : 'hover:border-primary/50 hover:bg-primary/5'
        }`}
        onClick={() => onChange('PLANO_MANUTENCAO')}
        disabled={disabled}
      >
        <Settings className={`h-6 w-6 ${value === 'PLANO_MANUTENCAO' ? 'text-primary-foreground' : 'text-green-600'}`} />
        <span className="text-xs font-medium">Plano Manutenção</span>
        <span className="text-[10px] opacity-70">Preventiva/Preditiva</span>
      </Button>

      {/* Solicitação de Serviço */}
      <Button
        type="button"
        variant={value === 'SOLICITACAO_SERVICO' ? 'default' : 'outline'}
        className={`h-24 flex-col gap-2 relative transition-all duration-200 ${
          value === 'SOLICITACAO_SERVICO'
            ? 'ring-2 ring-primary ring-offset-2 bg-primary hover:bg-primary/90'
            : 'hover:border-primary/50 hover:bg-primary/5'
        }`}
        onClick={() => onChange('SOLICITACAO_SERVICO')}
        disabled={disabled}
      >
        <FilePenLine className={`h-6 w-6 ${value === 'SOLICITACAO_SERVICO' ? 'text-primary-foreground' : 'text-orange-600'}`} />
        <span className="text-xs font-medium">Solicitação</span>
        <span className="text-[10px] opacity-70">Requisição</span>
      </Button>

      {/* Manual */}
      <Button
        type="button"
        variant={value === 'MANUAL' ? 'default' : 'outline'}
        className={`h-24 flex-col gap-2 relative transition-all duration-200 ${
          value === 'MANUAL'
            ? 'ring-2 ring-primary ring-offset-2 bg-primary hover:bg-primary/90'
            : 'hover:border-primary/50 hover:bg-primary/5'
        }`}
        onClick={() => onChange('MANUAL')}
        disabled={disabled}
      >
        <FileText className={`h-6 w-6 ${value === 'MANUAL' ? 'text-primary-foreground' : 'text-blue-600'}`} />
        <span className="text-xs font-medium">Manual</span>
        <span className="text-[10px] opacity-70">Criação direta</span>
      </Button>
    </div>
  );
};
