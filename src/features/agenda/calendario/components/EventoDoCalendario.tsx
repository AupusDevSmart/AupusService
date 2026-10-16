import { Link } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ROTULO_FREQUENCIA } from '@/features/planos-manutencao/utils/frequencia';
import type { EventoDaAgenda } from '@/services/eventos-da-agenda.services';
import { SITUACOES } from '@/features/agenda/calendario/config/situacoes';
import { horaDoEvento, rotuloCurto } from '@/features/agenda/calendario/utils/evento';
import { formatarEmBrasilia } from '@/features/agenda/calendario/utils/periodo';

export function PontoDaSituacao({ situacao, className }: { situacao: EventoDaAgenda['situacao']; className?: string }) {
  return <span aria-hidden className={cn('inline-block h-2 w-2 shrink-0 rounded-full', SITUACOES[situacao].ponto, className)} />;
}

const dica = (evento: EventoDaAgenda) =>
  [evento.titulo, evento.descricao, evento.planta_nome, SITUACOES[evento.situacao].rotulo].filter(Boolean).join(' · ');

const dia = (iso: string) => formatarEmBrasilia(iso, 'dd/MM/yyyy');
const diaEHora = (iso: string) => formatarEmBrasilia(iso, "dd/MM/yyyy 'às' HH:mm");

/** Previsto, atrasado ou "não sai": o que é, quando vence e quando o gerador programa. */
export function DetalheDaPrevisao({ evento }: { evento: EventoDaAgenda }) {
  const previsao = evento.previsao;
  if (!previsao) return null;
  const situacao = SITUACOES[evento.situacao];
  const linhas: [string, string][] = [
    ['Equipamento', previsao.equipamento_nome],
    ...(evento.instalacoes.length ? [['Instalação', evento.instalacoes.join(', ')] as [string, string]] : []),
    ...(evento.planta_nome ? [['Planta', evento.planta_nome] as [string, string]] : []),
    ['Frequência', previsao.frequencia ? (ROTULO_FREQUENCIA[previsao.frequencia] ?? previsao.frequencia) : '—'],
    ['Vence em', dia(previsao.ciclo)],
    ['Data prevista', `${dia(evento.data)}${previsao.data_estimada ? ' (estimada)' : ''}`],
  ];

  return (
    <div className="space-y-3 p-4 text-sm">
      <div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <PontoDaSituacao situacao={evento.situacao} />
          {situacao.rotulo} · Preventiva
        </p>
        <p className="mt-1 font-medium text-foreground">{previsao.tarefa_nome}</p>
        <p className="text-xs text-muted-foreground">{previsao.tarefa_tag}</p>
      </div>
      <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-xs">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="contents">
            <dt className="text-muted-foreground">{rotulo}</dt>
            <dd className="text-foreground">{valor}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">{explicacao(evento)}</p>
    </div>
  );
}

function explicacao(evento: EventoDaAgenda): string {
  const previsao = evento.previsao!;
  if (evento.situacao === 'nao_sai') return evento.motivo ?? 'O gerador não consegue programar esta tarefa.';
  const quando = previsao.programacao_a_partir_de ? diaEHora(previsao.programacao_a_partir_de) : null;
  if (evento.situacao === 'atrasado') {
    return `Venceu e ainda não foi programada. O gerador de preventivas a programa na próxima rodada${quando ? `, em ${quando}` : ''}.`;
  }
  const estimada = previsao.data_estimada
    ? ' A data é estimada: o gerador junta as tarefas da mesma instalação que vencem em até 14 dias, e a programação pode ser remarcada.'
    : '';
  return `${quando ? `A programação automática é criada em ${quando}.` : 'A programação automática ainda não tem data.'}${estimada}`;
}

/**
 * Um evento no calendário. OS e programação abrem a página do registro; a
 * previsão não tem página e mostra a tarefa e quando o gerador a programa.
 */
export function EventoDoCalendario({ evento, comHora = true, className }: { evento: EventoDaAgenda; comHora?: boolean; className?: string }) {
  const hora = comHora ? horaDoEvento(evento) : null;
  const classe = cn(
    'flex w-full min-w-0 items-center gap-1.5 rounded bg-transparent px-1.5 py-0.5 text-left text-xs text-foreground',
    'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    className,
  );
  const conteudo = (
    <>
      <PontoDaSituacao situacao={evento.situacao} />
      {hora && <span className="shrink-0 tabular-nums text-muted-foreground">{hora}</span>}
      <span className="truncate">{rotuloCurto(evento)}</span>
    </>
  );

  if (evento.link) {
    return (
      <Link to={evento.link} className={classe} title={dica(evento)}>
        {conteudo}
      </Link>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* data-fundo-proprio: o tema escuro pinta todo gatilho de popover com o fundo do card */}
        <button type="button" className={classe} title={dica(evento)} data-fundo-proprio>
          {conteudo}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <DetalheDaPrevisao evento={evento} />
      </PopoverContent>
    </Popover>
  );
}
