// src/features/solicitacoes-servico/components/ActionConfirmPanel.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Trash2,
  Loader2,
} from 'lucide-react';

export type PendingAction = 'excluir';

const actionConfig: Record<PendingAction, {
  confirmLabel: string;
  icon: any;
  variant: 'default' | 'destructive';
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
}> = {
  excluir: {
    confirmLabel: 'Confirmar Exclusão',
    icon: Trash2,
    variant: 'destructive',
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
