// src/features/solicitacoes-servico/components/ActionConfirmPanel.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Trash2,
  Loader2,
  FileCheck,
  FileX,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';

/** As ações que pedem confirmação; as da proposta (29/out/2026) mudam o status da solicitação */
export type PendingAction = 'excluir' | 'revisar' | 'reabrir' | 'nao_aprovada';

const actionConfig: Record<PendingAction, {
  confirmLabel: string;
  icon: LucideIcon;
  variant: 'default' | 'destructive';
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  /** O que a ação faz, antes de confirmar */
  aviso?: string;
}> = {
  excluir: {
    confirmLabel: 'Confirmar Exclusão',
    icon: Trash2,
    variant: 'destructive',
  },
  revisar: {
    confirmLabel: 'Revisar proposta',
    icon: FileCheck,
    variant: 'default',
    aviso: 'Revisada, a proposta trava para edição e a solicitação pode ser programada. A programação herda dela as instruções, os valores e a logística.',
  },
  reabrir: {
    confirmLabel: 'Reabrir proposta',
    icon: RotateCcw,
    variant: 'default',
    inputLabel: 'Por que reabrir (opcional)',
    inputPlaceholder: 'Ex.: o cliente pediu outra data',
    aviso: 'A proposta volta à edição; para programar, revise-a de novo.',
  },
  nao_aprovada: {
    confirmLabel: 'Marcar como não aprovada',
    icon: FileX,
    variant: 'destructive',
    inputLabel: 'Por que o cliente não aprovou',
    inputPlaceholder: 'Ex.: achou caro, adiou o serviço',
    inputRequired: true,
  },
};

interface ActionConfirmPanelProps {
  action: PendingAction;
  onConfirm: (input?: string) => Promise<void>;
}

export function ActionConfirmPanel({ action, onConfirm }: ActionConfirmPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const config = actionConfig[action];
  const Icon = config.icon;
  const canConfirm = !config.inputRequired || inputValue.trim().length > 0;

  const handleConfirm = async () => {
    if (!canConfirm || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(inputValue.trim() || undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t mt-6 pt-4 space-y-3">
      <h3 className="text-sm font-medium">Confirmar ação</h3>
      {config.aviso && <p className="text-sm text-muted-foreground">{config.aviso}</p>}

      {config.inputLabel && (
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">
            {config.inputLabel}
            {config.inputRequired && <span className="text-destructive ml-1">*</span>}
          </label>
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={config.inputPlaceholder}
            rows={3}
            className="resize-none"
          />
        </div>
      )}

      <Button
        type="button"
        variant={config.variant}
        onClick={handleConfirm}
        disabled={!canConfirm || submitting}
        className="w-full"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <Icon className="h-4 w-4 mr-1.5" />
        )}
        {config.confirmLabel}
      </Button>
    </div>
  );
}
