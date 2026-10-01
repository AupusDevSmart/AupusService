// src/features/execucao-os/components/ActionConfirmPanel.tsx
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Play, Pause, RotateCcw, Wrench, ClipboardCheck, CheckCircle, Undo2, Ban, Loader2 } from 'lucide-react';
import { AvaliacaoEstrelas } from './AvaliacaoEstrelas';

export type PendingAction = 'iniciar' | 'pausar' | 'retomar' | 'executar' | 'auditar' | 'finalizar' | 'reabrir' | 'cancelar';

interface ActionField {
  key: string;
  label: string;
  type: 'textarea' | 'text' | 'datetime-local' | 'number' | 'estrelas';
  placeholder?: string;
  required?: boolean;
  rows?: number;
  min?: number;
  step?: number;
  defaultNow?: boolean;
  /** Vai para o bloco "Mais detalhes", recolhido */
  detalhe?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- entidade da OS transformada
  condition?: (entity: any) => boolean;
}

interface ActionMeta {
  confirmLabel: string;
  icon: typeof Play;
  variant: 'default' | 'destructive';
  fields: ActionField[];
}

/**
 * O que cada transição pede (docs/SPEC-EXECUCAO-DA-OS.md).
 *
 * Executar pedia 11 campos, vários redundantes com o checklist. Ficaram o
 * resultado, os problemas, o motivo de cada tarefa não feita e o KM (só com
 * veículo); recomendações e incidente de segurança vão recolhidos. Saíram
 * atividades, procedimentos, EPIs, custos adicionais e próxima manutenção (D3).
 */
/**
 * Reserva de viatura ainda ativa: é ela que recebe o km (saída no Iniciar,
 * retorno no Executar). Reserva já finalizada ou cancelada não pede km — antes
 * o campo aparecia e o valor era descartado em silêncio.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- entidade da OS transformada
const temReservaAtiva = (entity: any) => entity?.reserva_veiculo?.status === 'ativa';

const actionConfig: Record<PendingAction, ActionMeta> = {
  iniciar: {
    confirmLabel: 'Confirmar início',
    icon: Play,
    variant: 'default',
    fields: [
      { key: 'data_hora_inicio_real', label: 'Data e hora de início', type: 'datetime-local', defaultNow: true },
      {
        key: 'km_inicial',
        label: 'KM inicial do veículo',
        type: 'number',
        placeholder: 'Opcional',
        min: 0,
        condition: temReservaAtiva,
      },
      { key: 'observacoes', label: 'Observações do início', type: 'textarea', placeholder: 'Opcional', rows: 2 },
    ],
  },
  pausar: {
    confirmLabel: 'Confirmar pausa',
    icon: Pause,
    variant: 'default',
    fields: [
      { key: 'motivo_pausa', label: 'Motivo da pausa', type: 'textarea', required: true, rows: 2 },
    ],
  },
  retomar: {
    confirmLabel: 'Confirmar retomada',
    icon: RotateCcw,
    variant: 'default',
    fields: [
      { key: 'observacoes_retomada', label: 'Observações', type: 'textarea', placeholder: 'Opcional', rows: 2 },
    ],
  },
  executar: {
    confirmLabel: 'Confirmar Execução',
    icon: Wrench,
    variant: 'default',
    fields: [
      {
        key: 'resultado_servico',
        label: 'Resultado do serviço',
        type: 'textarea',
        placeholder: 'O que foi feito e em que estado o equipamento ficou',
        required: true,
        rows: 3,
      },
      { key: 'problemas_encontrados', label: 'Problemas encontrados', type: 'textarea', placeholder: 'Opcional', rows: 2 },
      {
        key: 'km_final',
        label: 'KM final do veículo',
        type: 'number',
        placeholder: 'KM no retorno',
        min: 0,
        condition: temReservaAtiva,
      },
      { key: 'recomendacoes', label: 'Recomendações', type: 'textarea', placeholder: 'Para as próximas manutenções', rows: 2, detalhe: true },
      { key: 'incidentes_seguranca', label: 'Incidente de segurança', type: 'text', placeholder: 'Se houve, descreva', detalhe: true },
    ],
  },
  auditar: {
    confirmLabel: 'Confirmar Auditoria',
    icon: ClipboardCheck,
    variant: 'default',
    fields: [
      { key: 'avaliacao_qualidade', label: 'Qualidade do serviço', type: 'estrelas', required: true },
      { key: 'observacoes_qualidade', label: 'Observações da auditoria', type: 'textarea', placeholder: 'Opcional', rows: 3 },
    ],
  },
  finalizar: {
    confirmLabel: 'Confirmar finalização',
    icon: CheckCircle,
    variant: 'default',
    fields: [
      { key: 'observacoes', label: 'Observações da finalização', type: 'textarea', placeholder: 'Opcional', rows: 3 },
    ],
  },
  reabrir: {
    confirmLabel: 'Confirmar reabertura',
    icon: Undo2,
    variant: 'default',
    fields: [
      { key: 'observacoes', label: 'Motivo da reabertura', type: 'textarea', placeholder: 'O que precisa ser refeito (opcional)', rows: 3 },
    ],
  },
  cancelar: {
    confirmLabel: 'Confirmar cancelamento',
    icon: Ban,
    variant: 'destructive',
    fields: [
      { key: 'motivo_cancelamento', label: 'Motivo do cancelamento', type: 'textarea', required: true, rows: 3 },
    ],
  },
};

function nowDatetimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const preenchido = (v: unknown) => v !== undefined && v !== null && String(v).trim() !== '';

interface ActionConfirmPanelProps {
  action: PendingAction;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- entidade da OS transformada
  entity?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- payload vai direto para a rota da transição
  onConfirm: (data: Record<string, any>) => Promise<void>;
  /** Desiste desta ação e volta para a lista de ações */
  onVoltar?: () => void;
  /**
   * Executar: tarefas ainda pendentes. Cada uma precisa de motivo — fica "não
   * feita" e volta para a agenda (D2). Não bloqueia a execução.
   */
  tarefasPendentes?: { id: string; nome: string }[];
}

export function ActionConfirmPanel({
  action,
  entity,
  onConfirm,
  onVoltar,
  tarefasPendentes = [],
}: ActionConfirmPanelProps) {
  const config = actionConfig[action];
  const Icon = config.icon;
  const idBase = useId();
  const pendentes = action === 'executar' ? tarefasPendentes : [];

  const visiveis = config.fields.filter((f) => !f.condition || f.condition(entity));
  const principais = visiveis.filter((f) => !f.detalhe);
  const detalhes = visiveis.filter((f) => f.detalhe);

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const inicial: Record<string, unknown> = {};
    for (const field of visiveis) {
      inicial[field.key] = field.defaultNow && field.type === 'datetime-local' ? nowDatetimeLocal() : '';
    }
    return inicial;
  });
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const setValue = (key: string, value: unknown) => setValues((prev) => ({ ...prev, [key]: value }));

  const canConfirm =
    visiveis.filter((f) => f.required).every((f) => preenchido(values[f.key])) &&
    pendentes.every((t) => preenchido(motivos[t.id]));

  const handleConfirm = async () => {
    if (!canConfirm || submitting) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const field of visiveis) {
        const v = values[field.key];
        if (!preenchido(v)) continue;
        if (field.type === 'number' || field.type === 'estrelas') {
          payload[field.key] = Number(v);
        } else if (field.type === 'datetime-local') {
          // O input devolve hora local sem fuso ("2026-09-29T09:00"). Enviado
          // assim, o backend fazia new Date() no fuso do SERVIDOR. Convertido
          // aqui, no navegador, vira o instante que a pessoa quis dizer.
          payload[field.key] = new Date(String(v)).toISOString();
        } else {
          payload[field.key] = String(v).trim();
        }
      }
      if (pendentes.length > 0) {
        payload.tarefas_nao_feitas = pendentes.map((t) => ({ id: t.id, motivo: motivos[t.id].trim() }));
      }
      await onConfirm(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const idDe = (key: string) => `${idBase}-${key}`;

  const campo = (field: ActionField) => {
    const value = (values[field.key] as string | number | undefined) ?? '';
    const rotulo = (
      <label htmlFor={idDe(field.key)} className="mb-1.5 block text-sm text-muted-foreground">
        {field.label}
        {field.required && <span className="ml-1 text-destructive">*</span>}
      </label>
    );

    switch (field.type) {
      case 'estrelas':
        return (
          <div key={field.key}>
            <span className="mb-1.5 block text-sm text-muted-foreground">
              {field.label}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </span>
            <AvaliacaoEstrelas valor={Number(value) || null} onChange={(n) => setValue(field.key, n)} />
          </div>
        );
      case 'textarea':
        return (
          <div key={field.key}>
            {rotulo}
            <Textarea
              id={idDe(field.key)}
              value={String(value)}
              onChange={(e) => setValue(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              className="resize-none"
            />
          </div>
        );
      default:
        return (
          <div key={field.key}>
            {rotulo}
            <Input
              id={idDe(field.key)}
              type={field.type}
              value={String(value)}
              onChange={(e) => setValue(field.key, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              step={field.step}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Confirmar ação</h3>

      <div className="space-y-3">{principais.map(campo)}</div>

      {pendentes.length > 0 && (
        <div className="space-y-3 rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">
              {pendentes.length === 1 ? 'Uma tarefa não foi marcada como feita' : `${pendentes.length} tarefas não foram marcadas como feitas`}
            </p>
            <p className="text-xs text-muted-foreground">
              Diga o motivo de cada uma. Elas ficam registradas como não feitas e voltam para a agenda, atrasadas.
            </p>
          </div>
          {pendentes.map((t) => (
            <div key={t.id}>
              <label htmlFor={idDe(`motivo-${t.id}`)} className="mb-1.5 block text-sm text-muted-foreground">
                {`Por que "${t.nome}" não foi feita?`}
                <span className="ml-1 text-destructive">*</span>
              </label>
              <Input
                id={idDe(`motivo-${t.id}`)}
                value={motivos[t.id] ?? ''}
                onChange={(e) => setMotivos((prev) => ({ ...prev, [t.id]: e.target.value }))}
                placeholder="Ex.: faltou material, acesso bloqueado, chuva"
              />
            </div>
          ))}
          {pendentes.length > 1 && preenchido(motivos[pendentes[0].id]) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setMotivos((prev) => {
                  const primeiro = prev[pendentes[0].id];
                  return Object.fromEntries(pendentes.map((t) => [t.id, preenchido(prev[t.id]) ? prev[t.id] : primeiro]));
                })
              }
            >
              Usar o mesmo motivo nas outras
            </Button>
          )}
        </div>
      )}

      {detalhes.length > 0 && (
        <details className="rounded-md border px-3 py-2">
          <summary className="cursor-pointer text-sm text-muted-foreground">Mais detalhes</summary>
          <div className="mt-3 space-y-3">{detalhes.map(campo)}</div>
        </details>
      )}

      <Button
        type="button"
        variant={config.variant}
        onClick={handleConfirm}
        disabled={!canConfirm || submitting}
        className="w-full"
      >
        {submitting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Icon className="h-4 w-4 mr-1.5" />}
        {config.confirmLabel}
      </Button>

      {onVoltar && (
        <Button type="button" variant="ghost" size="sm" onClick={onVoltar} disabled={submitting} className="w-full">
          Escolher outra ação
        </Button>
      )}
    </div>
  );
}
