import { useMemo, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { isValid, parse } from 'date-fns';
import { AlertTriangle, CalendarX2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Combobox } from '@/core';
import { cn } from '@/lib/utils';
import { mensagemDoBackend } from '@/utils/api-error';
import { tipoLabels } from '@/features/execucao-os/config/labels';
import type { TipoDaOS } from '@/services/eventos-da-agenda.services';
import { ORDEM_DAS_SITUACOES, SITUACOES } from '@/features/agenda/calendario/config/situacoes';
import { useEquipamentosDoFiltro } from '@/hooks/useEquipamentosDoFiltro';
import { useEventosDaAgenda } from '@/features/agenda/calendario/hooks/useEventosDaAgenda';
import { agruparPorDia, deslocar, diaParaApi, periodoDaVisao, tituloDoPeriodo, type Visao } from '@/features/agenda/calendario/utils/periodo';
import { emBrasilia } from '@/utils/brasilia';
import { PontoDaSituacao } from '@/features/agenda/calendario/components/EventoDoCalendario';
import { VisaoLista, VisaoMes, VisaoSemana } from '@/features/agenda/calendario/components/VisoesDoCalendario';

const VISOES: { valor: Visao; rotulo: string }[] = [
  { valor: 'mes', rotulo: 'Mês' },
  { valor: 'semana', rotulo: 'Semana' },
  { valor: 'lista', rotulo: 'Lista' },
];

const TIPOS = Object.keys(tipoLabels) as TipoDaOS[];
const TODOS = 'todos';

const lerVisao = (valor: string | null): Visao => (valor === 'semana' || valor === 'lista' ? valor : 'mes');
const lerDia = (valor: string | null) => {
  const dia = valor ? parse(valor, 'yyyy-MM-dd', new Date()) : emBrasilia(new Date());
  return isValid(dia) ? dia : emBrasilia(new Date());
};
const lerTipo = (valor: string | null) => (valor && (TIPOS as string[]).includes(valor) ? (valor as TipoDaOS) : undefined);

function BotaoComDica({ dica, onClick, children }: { dica: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={onClick} aria-label={dica}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{dica}</TooltipContent>
    </Tooltip>
  );
}

/**
 * O calendário de manutenção (SN-52): programações, OS e a previsão do gerador
 * de preventivas, em mês, semana ou lista. O estado mora na URL — abrir uma OS
 * e voltar devolve o mesmo período e os mesmos filtros.
 */
export function CalendarioPage() {
  const [params, setParams] = useSearchParams();
  const visao = lerVisao(params.get('visao'));
  const base = lerDia(params.get('data'));
  const plantaId = params.get('planta') ?? undefined;
  const equipamentoId = params.get('equipamento') ?? undefined;
  const equipamentoNome = params.get('equipamento_nome') ?? '';
  const tipo = lerTipo(params.get('tipo'));

  const mudar = (mudancas: Record<string, string | undefined>) =>
    setParams(
      (atual) => {
        const proximo = new URLSearchParams(atual);
        for (const [chave, valor] of Object.entries(mudancas)) {
          if (valor) proximo.set(chave, valor);
          else proximo.delete(chave);
        }
        return proximo;
      },
      { replace: true },
    );

  const periodo = useMemo(() => periodoDaVisao(visao, base), [visao, base.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtro = { inicio: diaParaApi(periodo.inicio), fim: diaParaApi(periodo.fim), planta_id: plantaId, equipamento_id: equipamentoId, tipo };
  const { data, error, isError, isFetching, refetch } = useEventosDaAgenda(filtro);
  const porDia = useMemo(() => agruparPorDia(data?.eventos ?? []), [data]);
  // Hoje em Brasília, como os dias dos eventos
  const hoje = emBrasilia(new Date());

  const plantas = (data?.opcoes.plantas ?? []).map((p) => ({ value: p.id.trim(), label: p.nome }));
  // Planta da URL fora das opções (de outro acesso, ou excluída): não fingir "todas"
  const plantaForaDoAcesso = !!data && !!plantaId && !plantas.some((p) => p.value === plantaId);
  const equipamentos = useEquipamentosDoFiltro(plantaId, equipamentoId ? { id: equipamentoId, rotulo: equipamentoNome } : undefined);
  const temFiltro = !!(plantaId || equipamentoId || tipo);

  const ir = (passos: number) => mudar({ data: diaParaApi(deslocar(visao, base, passos)) });

  return (
    <Layout>
      <Layout.Main>
        <div className="flex w-full flex-col">
          <TitleCard title="Calendário de manutenção" description="Programações, ordens de serviço e a previsão das preventivas" />

          <TooltipProvider>
            <div className="mb-3 flex flex-col gap-3 px-3 sm:px-0 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="h-9" onClick={() => mudar({ data: undefined })}>
                  Hoje
                </Button>
                <BotaoComDica dica={visao === 'semana' ? 'Semana anterior' : 'Mês anterior'} onClick={() => ir(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </BotaoComDica>
                <BotaoComDica dica={visao === 'semana' ? 'Próxima semana' : 'Próximo mês'} onClick={() => ir(1)}>
                  <ChevronRight className="h-4 w-4" />
                </BotaoComDica>
                <h2 className="ml-1 text-base font-semibold text-foreground sm:text-lg" aria-live="polite">
                  {tituloDoPeriodo(visao, base)}
                </h2>
              </div>
              <Tabs value={visao} onValueChange={(v) => mudar({ visao: v === 'mes' ? undefined : v })}>
                <TabsList>
                  {VISOES.map((v) => (
                    <TabsTrigger key={v.valor} value={v.valor}>
                      {v.rotulo}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </TooltipProvider>

          <div className="mb-3 grid grid-cols-1 gap-2 px-3 sm:grid-cols-2 sm:px-0 lg:grid-cols-[repeat(3,minmax(0,16rem))_auto]">
            <Combobox
              options={plantas}
              value={plantaId ?? ''}
              onValueChange={(valor) => mudar({ planta: valor || undefined, equipamento: undefined, equipamento_nome: undefined })}
              placeholder={plantaForaDoAcesso ? 'Planta indisponível' : 'Todas as plantas'}
              searchPlaceholder="Buscar planta..."
              emptyText="Nenhuma planta."
            />
            <Combobox
              options={equipamentos.opcoes}
              value={equipamentoId ?? ''}
              onValueChange={(valor) =>
                mudar({ equipamento: valor || undefined, equipamento_nome: equipamentos.opcoes.find((o) => o.value === valor)?.label })
              }
              placeholder="Todos os equipamentos"
              searchPlaceholder="Buscar equipamento..."
              emptyText="Nenhum equipamento."
              paginacao={equipamentos.paginacao}
            />
            <Select value={tipo ?? TODOS} onValueChange={(valor) => mudar({ tipo: valor === TODOS ? undefined : valor })}>
              <SelectTrigger className="h-9" aria-label="Tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos os tipos</SelectItem>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {tipoLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {temFiltro && (
              <Button
                type="button"
                variant="ghost"
                className="h-9 justify-self-start"
                onClick={() => mudar({ planta: undefined, equipamento: undefined, equipamento_nome: undefined, tipo: undefined })}
              >
                <X className="mr-1 h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>

          {(data?.atrasados_antes ?? 0) > 0 && (
            <p role="status" className="mx-3 mb-2 flex items-start gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground sm:mx-0">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>
                {data!.atrasados_antes === 1
                  ? '1 pendência venceu antes deste período e continua por fazer'
                  : `${data!.atrasados_antes} pendências venceram antes deste período e continuam por fazer`}{' '}
                (OS e programações não feitas, ou preventivas que o gerador ainda vai programar).
              </span>
            </p>
          )}
          {(data?.sem_data ?? 0) > 0 && (
            <p role="status" className="mx-3 mb-2 flex items-start gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground sm:mx-0">
              <CalendarX2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {data!.sem_data === 1
                  ? '1 programação ou OS em aberto não tem data marcada e não aparece no calendário.'
                  : `${data!.sem_data} programações ou OS em aberto não têm data marcada e não aparecem no calendário.`}{' '}
                <Link to="/programacao-os" className="text-foreground underline underline-offset-2">
                  Ver programações
                </Link>
              </span>
            </p>
          )}

          <div className={cn('px-3 transition-opacity sm:px-0', isFetching && 'opacity-60')} aria-busy={isFetching}>
            {isError && !data ? (
              <div className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">
                <p>Não foi possível carregar o calendário.</p>
                {mensagemDoBackend(error) && <p className="mt-1">{mensagemDoBackend(error)}</p>}
                <Button type="button" variant="outline" className="mt-3" onClick={() => void refetch()}>
                  Tentar de novo
                </Button>
              </div>
            ) : visao === 'semana' ? (
              <VisaoSemana dias={periodo.dias} porDia={porDia} hoje={hoje} />
            ) : visao === 'lista' ? (
              <VisaoLista dias={periodo.dias} porDia={porDia} hoje={hoje} />
            ) : (
              <VisaoMes dias={periodo.dias} porDia={porDia} hoje={hoje} mes={base} />
            )}
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-3 text-xs text-muted-foreground sm:px-0" aria-label="Legenda">
            {ORDEM_DAS_SITUACOES.map((situacao) => (
              <li key={situacao} className="flex items-center gap-1.5" title={SITUACOES[situacao].descricao}>
                <PontoDaSituacao situacao={situacao} />
                {SITUACOES[situacao].rotulo}
              </li>
            ))}
          </ul>
          <p className="mt-1 px-3 text-xs text-muted-foreground sm:px-0">Datas e horas no horário de Brasília.</p>
        </div>
      </Layout.Main>
    </Layout>
  );
}
