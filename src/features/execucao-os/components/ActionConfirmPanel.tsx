// src/features/execucao-os/components/ActionConfirmPanel.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Pause, RotateCcw, Wrench, ClipboardCheck, CheckCircle, Ban, Loader2 } from 'lucide-react';

export type PendingAction = 'iniciar' | 'pausar' | 'retomar' | 'executar' | 'auditar' | 'finalizar' | 'cancelar';

interface ActionField {
  key: string;
  label: string;
  type: 'textarea' | 'text' | 'datetime-local' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  rows?: number;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  defaultNow?: boolean;
  colSpan?: 1 | 2; // 1 = meia largura, 2 = largura total (default: 2 para textarea, 1 para outros)
  condition?: (entity: any) => boolean;
}

interface ActionMeta {
  confirmLabel: string;
  icon: any;
  variant: 'default' | 'destructive';
  className?: string;
  fields: ActionField[];
}

const actionConfig: Record<PendingAction, ActionMeta> = {
  iniciar: {
    confirmLabel: 'Confirmar Inicio',
    icon: Play,
    variant: 'default',
    className: 'bg-green-600 hover:bg-green-700',
    fields: [
      {
        key: 'data_hora_inicio_real',
        label: 'Data/Hora de Inicio',
        type: 'datetime-local',
        defaultNow: true,
        colSpan: 1,
      },
      {
        key: 'observacoes',
        label: 'Observacoes do inicio',
        type: 'textarea',
        placeholder: 'Observacoes do inicio (opcional)',
        rows: 2,
        colSpan: 2,
      },
    ],
  },
  pausar: {
    confirmLabel: 'Confirmar Pausa',
    icon: Pause,
    variant: 'default',
    className: 'bg-yellow-600 hover:bg-yellow-700',
    fields: [
      {
        key: 'motivo_pausa',
        label: 'Motivo da pausa',
        type: 'textarea',
        placeholder: 'Descreva o motivo da pausa',
        required: true,
        rows: 2,
        colSpan: 2,
      },
    ],
  },
  retomar: {
    confirmLabel: 'Confirmar Retomada',
    icon: RotateCcw,
    variant: 'default',
    className: 'bg-green-600 hover:bg-green-700',
    fields: [
      {
        key: 'observacoes_retomada',
        label: 'Observacoes',
        type: 'textarea',
        placeholder: 'Observacoes da retomada (opcional)',
        rows: 2,
        colSpan: 2,
      },
    ],
  },
  executar: {
    confirmLabel: 'Confirmar Execucao',
    icon: Wrench,
    variant: 'default',
    className: 'bg-blue-600 hover:bg-blue-700',
    fields: [
      {
        key: 'resultado_servico',
        label: 'Resultado do servico',
        type: 'textarea',
        placeholder: 'Descreva o resultado do servico executado',
        required: true,
        rows: 3,
        colSpan: 2,
      },
      {
        key: 'atividades_realizadas',
        label: 'Atividades realizadas',
        type: 'textarea',
        placeholder: 'Descreva as atividades realizadas (opcional)',
        rows: 2,
        colSpan: 2,
      },
      {
        key: 'problemas_encontrados',
        label: 'Problemas encontrados',
        type: 'textarea',
        placeholder: 'Descreva problemas encontrados (opcional)',
        rows: 2,
        colSpan: 2,
      },
      {
        key: 'recomendacoes',
        label: 'Recomendacoes',
        type: 'textarea',
        placeholder: 'Recomendacoes para proximas manutencoes (opcional)',
        rows: 2,
        colSpan: 2,
      },
      {
        key: 'procedimentos_seguidos',
        label: 'Procedimentos seguidos',
        type: 'textarea',
        placeholder: 'Procedimentos e normas seguidos (opcional)',
        rows: 2,
        colSpan: 2,
      },
      {
        key: 'equipamentos_seguranca',
        label: 'EPIs utilizados',
        type: 'text',
        placeholder: 'EPIs e equipamentos de seguranca (opcional)',
        colSpan: 1,
      },
      {
        key: 'incidentes_seguranca',
        label: 'Incidentes de seguranca',
        type: 'text',
        placeholder: 'Registrar incidentes (opcional)',
        colSpan: 1,
      },
      {
        key: 'km_final',
        label: 'KM Final do veiculo',
        type: 'number',
        placeholder: 'KM no retorno',
        colSpan: 1,
        condition: (entity) => !!(entity?.reserva_veiculo || entity?.reserva_id),
      },
      {
        key: 'custos_adicionais',
        label: 'Custos adicionais (R$)',
        type: 'number',
        placeholder: '0.00',
        min: 0,
        step: 0.01,
        colSpan: 1,
      },
      {
        key: 'proxima_manutencao',
        label: 'Proxima manutencao',
        type: 'datetime-local',
        colSpan: 1,
      },
    ],
  },
  auditar: {
    confirmLabel: 'Confirmar Auditoria',
    icon: ClipboardCheck,
    variant: 'default',
    className: 'bg-blue-600 hover:bg-blue-700',
    fields: [
      {
        key: 'avaliacao_qualidade',
        label: 'Avaliacao da qualidade',
        type: 'select',
        required: true,
        colSpan: 1,
        options: [
          { value: '1', label: '1 - Insatisfatorio' },
          { value: '2', label: '2 - Abaixo do esperado' },
          { value: '3', label: '3 - Satisfatorio' },
          { value: '4', label: '4 - Bom' },
          { value: '5', label: '5 - Excelente' },
        ],
      },
      {
        key: 'observacoes_qualidade',
        label: 'Observacoes da auditoria',
        type: 'textarea',
        placeholder: 'Observacoes sobre a qualidade do servico (opcional)',
        rows: 3,
        colSpan: 2,
      },
    ],
  },
  finalizar: {
    confirmLabel: 'Confirmar Finalizacao',
    icon: CheckCircle,
    variant: 'default',
    className: 'bg-green-600 hover:bg-green-700',
    fields: [
      {
        key: 'observacoes',
        label: 'Observacoes da finalizacao',
        type: 'textarea',
        placeholder: 'Observacoes da finalizacao (opcional)',
        rows: 3,
        colSpan: 2,
      },
    ],
  },
  cancelar: {
    confirmLabel: 'Confirmar Cancelamento',
    icon: Ban,
    variant: 'destructive',
    fields: [
      {
        key: 'motivo_cancelamento',
        label: 'Motivo do cancelamento',
        type: 'textarea',
        placeholder: 'Descreva o motivo do cancelamento',
        required: true,
        rows: 3,
        colSpan: 2,
      },
    ],
  },
};

function nowDatetimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Resolve o colSpan default: textarea = 2, outros = 1
function resolveColSpan(field: ActionField): 1 | 2 {
  if (field.colSpan) return field.colSpan;
  return field.type === 'textarea' ? 2 : 1;
}

interface ActionConfirmPanelProps {
  action: PendingAction;
  entity?: any;
  onConfirm: (data: Record<string, any>) => Promise<void>;
}

export function ActionConfirmPanel({ action, entity, onConfirm }: ActionConfirmPanelProps) {
  const config = actionConfig[action];
  const Icon = config.icon;

  const visibleFields = config.fields.filter(
    (f) => !f.condition || f.condition(entity)
  );

  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    for (const field of visibleFields) {
      if (field.defaultNow && field.type === 'datetime-local') {
        initial[field.key] = nowDatetimeLocal();
      } else {
        initial[field.key] = '';
      }
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);

  const setValue = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const canConfirm = visibleFields
    .filter((f) => f.required)
    .every((f) => {
      const v = values[f.key];
      return v !== undefined && v !== null && String(v).trim() !== '';
    });

  const handleConfirm = async () => {
    if (!canConfirm || submitting) return;
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {};
      for (const field of visibleFields) {
        const v = values[field.key];
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          if (field.type === 'number') {
            payload[field.key] = Number(v);
          } else {
            payload[field.key] = String(v).trim();
          }
        }
      }
      await onConfirm(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: ActionField) => {
    const value = values[field.key] ?? '';

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => setValue(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 3}
            className="resize-none"
          />
        );
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      case 'datetime-local':
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(field.key, e.target.value)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(field.key, e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
      case 'select':
        return (
          <Select value={value} onValueChange={(v) => setValue(field.key, v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="border-t mt-6 pt-4 space-y-4">
      <h3 className="text-sm font-medium">Confirmar acao</h3>

      <div className="grid grid-cols-2 gap-3">
        {visibleFields.map((field) => {
          const span = resolveColSpan(field);
          return (
            <div key={field.key} className={span === 2 ? 'col-span-2' : 'col-span-1'}>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              {renderField(field)}
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant={config.variant}
        onClick={handleConfirm}
        disabled={!canConfirm || submitting}
        className={`w-full ${config.className || ''}`}
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
