// src/features/execucao-os/components/ActionConfirmPanel.tsx
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Play, Pause, RotateCcw, Wrench, ClipboardCheck, CheckCircle, Undo2, Ban, Loader2 } from 'lucide-react';
import { AvaliacaoEstrelas } from './AvaliacaoEstrelas';
import { HorasDaEquipe } from './HorasDaEquipe';
import { duracaoLegivel } from '@/utils/horas';
import {
  horasDoPedido,
  linhasIniciais,
  pendenciaDasHoras,
  tempoEfetivoAgora,
  type LinhaDeHoras,
  type TecnicoDaOS,
} from '@/features/execucao-os/utils/horas-da-equipe';

export type PendingAction = 'iniciar' | 'pausar' | 'retomar' | 'executar' | 'auditar' | 'finalizar' | 'reabrir' | 'cancelar';

/**
 * O que o painel lê da OS aberta: a reserva (para pedir o km), o tipo (a
 * corretiva exige os dados de falha), a anomalia de origem (a data dela é o
 * início provável da parada) e os dados de falha que já estão na OS.
 */
type OSDoPainel =
  | {
      reserva_veiculo?: { status?: string } | null;
      tipo?: string;
      anomalia?: { data?: string | null; condicao?: string | null } | null;
      equipamento_parou?: boolean | null;
      parada_inicio?: string | null;
      parada_fim?: string | null;
      falha_sintoma?: string | null;
      falha_causa?: string | null;
      falha_acao?: string | null;
      problemas_encontrados?: string | null;
      recomendacoes?: string | null;
      incidentes_seguranca?: string | null;
      // SN-61: a equipe, para as horas trabalhadas, que começam no tempo efetivo
      id?: string;
      status?: string;
      statusExecucao?: string;
      tecnicos?: TecnicoDaOS[];
      tempo_efetivo_minutos?: number | null;
      tempo_efetivo_lido_em?: number;
      hh_estimado?: number;
    }
  | null
  | undefined;

/** O que já foi digitado no painel (texto, "sim"/"nao" ou número) */
type ValoresDoPainel = Record<string, unknown>;

/**
 * O que o painel entrega: só os campos preenchidos da ação, já convertidos
 * (número, ISO em UTC ou texto aparado). As chaves são as dos campos abaixo.
 */
export type DadosDaConfirmacao = {
  data_hora_inicio_real?: string;
  km_inicial?: number;
  km_final?: number;
  observacoes?: string;
  motivo_pausa?: string;
  observacoes_retomada?: string;
  resultado_servico?: string;
  // null: o campo veio preenchido da OS e foi apagado (reexecutar depois de reabrir)
  problemas_encontrados?: string | null;
  recomendacoes?: string | null;
  incidentes_seguranca?: string | null;
  equipamento_parou?: boolean;
  parada_inicio?: string | null;
  parada_fim?: string | null;
  falha_sintoma?: string | null;
  falha_causa?: string | null;
  falha_acao?: string | null;
  avaliacao_qualidade?: number;
  observacoes_qualidade?: string;
  motivo_cancelamento?: string;
  tarefas_nao_feitas?: { id: string; motivo: string }[];
  horas_dos_tecnicos?: { id: string; horas: number }[];
  tecnicos_extras?: { tecnico_id: string; horas: number }[];
};

interface ActionField {
  key: string;
  label: string;
  type: 'textarea' | 'text' | 'datetime-local' | 'number' | 'estrelas' | 'simnao';
  placeholder?: string;
  /** Booleano, ou pela OS e pelo que já foi respondido (a parada só se o equipamento parou) */
  required?: boolean | ((entity: OSDoPainel, valores: ValoresDoPainel) => boolean);
  rows?: number;
  min?: number;
  step?: number;
  defaultNow?: boolean;
  /** Vai para o bloco "Mais detalhes", recolhido (ou pela OS) */
  detalhe?: boolean | ((entity: OSDoPainel) => boolean);
  /**
   * O valor inicial a partir da OS (o que já está gravado, a data da
   * anomalia). Campo com valor inicial que for apagado vai como null: apagar é
   * apagar, não "manter o antigo calado".
   */
  inicial?: (entity: OSDoPainel) => string | null | undefined;
  condition?: (entity: OSDoPainel, valores: ValoresDoPainel) => boolean;
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
const temReservaAtiva = (entity: OSDoPainel) => entity?.reserva_veiculo?.status === 'ativa';

/**
 * SN-60: os dados de falha. Na corretiva vêm logo abaixo do resultado: o
 * painel pergunta se o equipamento parou; sintoma, causa e ação são
 * obrigatórios, e a parada só aparece se parou. Exigir parada de toda corretiva
 * obrigava a inventar uma (a anomalia nasce "funcionando" e o painel puxava a
 * data dela). Quando parou e voltou são opcionais (19/out/2026: o técnico nem
 * sempre sabe a hora), mas vão os dois juntos. Nos outros tipos, tudo em "Mais
 * detalhes" e opcional.
 */
const ehCorretiva = (entity: OSDoPainel) => entity?.tipo === 'CORRETIVA';
const naoEhCorretiva = (entity: OSDoPainel) => !ehCorretiva(entity);
/** Na corretiva, as datas só aparecem depois de responder que parou; nos outros tipos, sempre (recolhidas) */
const mostraParada = (entity: OSDoPainel, valores: ValoresDoPainel) => !ehCorretiva(entity) || valores.equipamento_parou === 'sim';

/** A resposta que já se sabe: o que a OS gravou, ou a anomalia que disse que parou. Sem isso, a pessoa escolhe. */
function parouDeAntes(os: OSDoPainel): string {
  if (os?.equipamento_parou === true || os?.parada_inicio) return 'sim';
  if (os?.equipamento_parou === false || os?.falha_sintoma) return 'nao';
  return os?.anomalia?.condicao === 'PARADO' ? 'sim' : '';
}

/** ISO em UTC -> o valor do datetime-local, na hora de quem está na tela. */
function paraDatetimeLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const CAMPOS_DA_FALHA: ActionField[] = [
  {
    key: 'equipamento_parou',
    label: 'O equipamento parou?',
    type: 'simnao',
    required: true,
    condition: ehCorretiva,
    inicial: parouDeAntes,
  },
  {
    key: 'parada_inicio',
    label: 'O equipamento parou em',
    type: 'datetime-local',
    detalhe: naoEhCorretiva,
    condition: mostraParada,
    // O que já está na OS; na primeira vez, na corretiva, a data da anomalia que
    // a originou (fora da corretiva, puxar a anomalia travava o botão por um
    // campo escondido em "Mais detalhes")
    inicial: (os) => paraDatetimeLocal(os?.parada_inicio ?? (ehCorretiva(os) ? os?.anomalia?.data : null)),
  },
  {
    key: 'parada_fim',
    label: 'Voltou a funcionar em',
    type: 'datetime-local',
    detalhe: naoEhCorretiva,
    condition: mostraParada,
    inicial: (os) => paraDatetimeLocal(os?.parada_fim),
  },
  {
    key: 'falha_sintoma',
    label: 'Sintoma',
    type: 'textarea',
    placeholder: 'O que se viu: alarme, ruído, desligamento',
    rows: 2,
    required: ehCorretiva,
    detalhe: naoEhCorretiva,
    inicial: (os) => os?.falha_sintoma,
  },
  {
    key: 'falha_causa',
    label: 'Causa',
    type: 'textarea',
    placeholder: 'Por que falhou',
    rows: 2,
    required: ehCorretiva,
    detalhe: naoEhCorretiva,
    inicial: (os) => os?.falha_causa,
  },
  {
    key: 'falha_acao',
    label: 'Ação tomada',
    type: 'textarea',
    placeholder: 'O que foi feito para o equipamento voltar',
    rows: 2,
    required: ehCorretiva,
    detalhe: naoEhCorretiva,
    inicial: (os) => os?.falha_acao,
  },
];

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
      {
        key: 'problemas_encontrados',
        label: 'Problemas encontrados',
        type: 'textarea',
        placeholder: 'Opcional',
        rows: 2,
        inicial: (os) => os?.problemas_encontrados,
      },
      ...CAMPOS_DA_FALHA,
      {
        key: 'km_final',
        label: 'KM final do veículo',
        type: 'number',
        placeholder: 'KM no retorno',
        min: 0,
        condition: temReservaAtiva,
      },
      {
        key: 'recomendacoes',
        label: 'Recomendações',
        type: 'textarea',
        placeholder: 'Para as próximas manutenções',
        rows: 2,
        detalhe: true,
        inicial: (os) => os?.recomendacoes,
      },
      {
        key: 'incidentes_seguranca',
        label: 'Incidente de segurança',
        type: 'text',
        placeholder: 'Se houve, descreva',
        detalhe: true,
        inicial: (os) => os?.incidentes_seguranca,
      },
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
  entity?: OSDoPainel;
  /** O payload vai direto para a rota da transição */
  onConfirm: (data: DadosDaConfirmacao) => Promise<void>;
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

  // Os valores de TODOS os campos (alguns só aparecem conforme a resposta de outro)
  const [values, setValues] = useState<ValoresDoPainel>(() => {
    const inicial: ValoresDoPainel = {};
    for (const field of config.fields) {
      inicial[field.key] = field.defaultNow && field.type === 'datetime-local' ? nowDatetimeLocal() : (field.inicial?.(entity) ?? '');
    }
    return inicial;
  });
  const visiveis = config.fields.filter((f) => !f.condition || f.condition(entity, values));
  const pela = (regra: boolean | ((e: OSDoPainel, v: ValoresDoPainel) => boolean) | undefined) =>
    typeof regra === 'function' ? regra(entity, values) : Boolean(regra);
  const principais = visiveis.filter((f) => !pela(f.detalhe));
  const detalhes = visiveis.filter((f) => pela(f.detalhe));
  const obrigatorio = (f: ActionField) => pela(f.required);
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  // SN-61: as horas de cada pessoa da equipe, e quem entrou na hora. O tempo
  // efetivo é o de agora, ao escolher Executar, não o de quando o sheet abriu
  const [tempoEfetivo] = useState(() => (action === 'executar' ? tempoEfetivoAgora(entity) : null));
  const [horas, setHoras] = useState<LinhaDeHoras[]>(() =>
    action === 'executar' ? linhasIniciais(entity?.tecnicos, tempoEfetivo) : [],
  );
  const pendenciaHoras = action === 'executar' ? pendenciaDasHoras(horas) : null;
  const [submitting, setSubmitting] = useState(false);

  const setValue = (key: string, value: unknown) => setValues((prev) => ({ ...prev, [key]: value }));

  // A parada vai inteira e coerente (a API recusa o contrário; aqui o aviso vem antes)
  const comParada = mostraParada(entity, values);
  const paradaInicio = comParada && preenchido(values.parada_inicio) ? new Date(String(values.parada_inicio)) : null;
  const paradaFim = comParada && preenchido(values.parada_fim) ? new Date(String(values.parada_fim)) : null;
  // A duração à vista: o ano digitado errado aparece como "365 d" antes de gravar
  const tempoParado =
    action === 'executar' && paradaInicio && paradaFim && paradaFim >= paradaInicio
      ? duracaoLegivel((paradaFim.getTime() - paradaInicio.getTime()) / 60_000)
      : null;
  const avisoDaParada =
    action !== 'executar'
      ? null
      : !!paradaInicio !== !!paradaFim
        ? 'Informe quando o equipamento parou e quando voltou a funcionar, os dois — ou deixe os dois em branco.'
        : paradaInicio && paradaFim && paradaFim < paradaInicio
          ? 'O equipamento voltou a funcionar antes de parar: confira as duas datas.'
          : null;

  const canConfirm =
    visiveis.filter(obrigatorio).every((f) => preenchido(values[f.key])) &&
    pendentes.every((t) => preenchido(motivos[t.id])) &&
    !avisoDaParada &&
    !pendenciaHoras;

  const handleConfirm = async () => {
    if (!canConfirm || submitting) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const field of visiveis) {
        const v = values[field.key];
        if (!preenchido(v)) {
          // Veio preenchido da OS e foi apagado: vai null, senão o antigo ficava calado
          if (field.inicial && preenchido(field.inicial(entity))) payload[field.key] = null;
          continue;
        }
        if (field.type === 'simnao') {
          payload[field.key] = v === 'sim';
        } else if (field.type === 'number' || field.type === 'estrelas') {
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
      if (action === 'executar') Object.assign(payload, horasDoPedido(horas));
      // As chaves são as dos campos da ação (actionConfig), com o valor já convertido
      await onConfirm(payload as DadosDaConfirmacao);
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
        {obrigatorio(field) && <span className="ml-1 text-destructive">*</span>}
      </label>
    );

    switch (field.type) {
      case 'simnao':
        return (
          <fieldset key={field.key}>
            <legend className="mb-1.5 block text-sm text-muted-foreground">
              {field.label}
              {obrigatorio(field) && <span className="ml-1 text-destructive">*</span>}
            </legend>
            <div className="flex gap-4 text-sm">
              {(['sim', 'nao'] as const).map((opcao) => (
                <label key={opcao} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name={idDe(field.key)}
                    value={opcao}
                    checked={value === opcao}
                    onChange={() => setValue(field.key, opcao)}
                    className="accent-foreground"
                  />
                  {opcao === 'sim' ? 'Sim' : 'Não'}
                </label>
              ))}
            </div>
          </fieldset>
        );
      case 'estrelas':
        return (
          <div key={field.key}>
            <span className="mb-1.5 block text-sm text-muted-foreground">
              {field.label}
              {obrigatorio(field) && <span className="ml-1 text-destructive">*</span>}
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

      {/* Fora do "Mais detalhes": recolhido, o aviso não se via e o botão ficava cinza sem motivo */}
      {avisoDaParada && (
        <p role="alert" className="text-xs text-destructive">{avisoDaParada}</p>
      )}
      {!avisoDaParada && tempoParado && <p className="text-xs text-muted-foreground">Parado por {tempoParado}</p>}

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

      {action === 'executar' && (
        <div className="space-y-1.5">
          <HorasDaEquipe
            osId={entity?.id}
            linhas={horas}
            onChange={setHoras}
            tempoEfetivoMinutos={tempoEfetivo}
            hhEstimado={entity?.hh_estimado}
          />
          {/* O botão fica cinza por isto: o motivo à vista */}
          {pendenciaHoras && <p className="text-xs text-muted-foreground">{pendenciaHoras}</p>}
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
