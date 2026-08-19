// src/features/dashboard/components/PainelManutencao.tsx
import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, RefreshCw, ChevronRight, X } from 'lucide-react';
import { Layout } from '@/components/common/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Combobox } from '@aupus/shared-pages';
import { formatApiError } from '@/utils/api-error';
import {
  dashboardManutencaoApi,
  type FiltrosDashboard,
} from '@/services/dashboard-manutencao.services';
import { CartaoIndicador, Quadro, SemDado } from './PainelPrimitivos';
import { DADOS_DEMO, PAINEL_USA_DADOS_DE_EXEMPLO } from './dadosDemo';

/**
 * Painel de gestão de manutenção e serviços.
 *
 * A ordem de leitura é a da reunião de rotina — estamos bem, cumprimos o plano,
 * quanto custou, o que está travado — e agora ela acontece por linha, não por
 * rolagem: a partir de 2xl (1536px) o painel inteiro ocupa exatamente uma tela.
 *
 * Como isso é conseguido: a raiz vira `h-full` sem rolagem, a faixa de gráficos
 * é `flex-1 min-h-0` e cada moldura é `min-h-0` com o corpo elástico. Assim os
 * gráficos absorvem a altura que sobrar em vez de terem altura fixa, e a soma
 * nunca ultrapassa a tela — em 1080p cada linha fica com ~175px, o suficiente
 * para uma série de doze meses continuar legível.
 *
 * Abaixo de 2xl não há espaço para doze gráficos legíveis lado a lado, então a
 * página volta a ser uma pilha rolável de uma a três colunas, com alturas fixas.
 *
 * Recharts, e não Chart.js como a especificação sugeria: o produto já usa
 * recharts, e uma segunda biblioteca de gráficos no mesmo bundle é custo sem
 * contrapartida.
 */

/** Cores dos gráficos. Fixas de propósito — precisam ter contraste nos dois temas. */
const COR = {
  azul: '#2a78d6',
  azulClaro: '#85b7eb',
  azulPalido: '#b5d4f4',
  laranja: '#eb6834',
  verde: '#1baf7a',
  vermelho: '#e34948',
  violeta: '#6d5bc4',
  ambar: '#eda100',
  trilho: 'hsl(var(--muted))',
};

type Periodo = NonNullable<FiltrosDashboard['periodo']>;

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: '12meses', label: 'Últimos 12 meses' },
  { value: 'mes', label: 'Mês atual' },
  { value: 'trimestre', label: 'Trimestre atual' },
  { value: 'ano', label: 'Ano corrente' },
];

/** Mesma escala de 1 a 5 do cadastro de equipamentos. */
const CRITICIDADES = [
  { value: 'all', label: 'Toda criticidade' },
  { value: '5', label: '5 · muito alta' },
  { value: '4', label: '4 · alta' },
  { value: '3', label: '3 · média' },
  { value: '2', label: '2 · baixa' },
  { value: '1', label: '1 · muito baixa' },
];

/**
 * Altura das molduras fora do modo "uma tela".
 *
 * Até 2xl cada gráfico tem altura fixa e a página rola; de 2xl para cima a
 * altura vem da grade (`2xl:h-auto`), que é quem sabe quanto sobrou.
 */
const ALTURA_PADRAO = 'h-[180px] 2xl:h-auto';

const moedaMil = (v: number) => `R$ ${v.toLocaleString('pt-BR')}k`;

/**
 * Tooltip no visual do produto — o padrão do recharts destoa do resto.
 *
 * As props sem `sufixo` são injetadas pelo recharts, não passadas por nós.
 */
interface PropsDicaGrafico {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; fill?: string }[];
  label?: string | number;
  sufixo?: string;
}

function DicaGrafico({ active, payload, label, sufixo }: PropsDicaGrafico) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded border border-border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-sm" style={{ background: p.color ?? p.fill }} />
          {p.name}: <span className="text-foreground">{p.value}{sufixo ?? ''}</span>
        </p>
      ))}
    </div>
  );
}

const eixo = { stroke: 'hsl(var(--muted-foreground))', fontSize: 10 };
const grade = { stroke: 'hsl(var(--border))' };

/** Wrapper do gráfico: ocupa toda a altura que a moldura deu. */
function Grafico({ children }: { children: React.ReactElement }) {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function PainelManutencao() {
  const navigate = useNavigate();
  const [parametrosUrl] = useSearchParams();
  const [filtros, setFiltros] = useState<FiltrosDashboard>({ periodo: '12meses' });

  /**
   * Dados de exemplo no lugar da resposta da API, para avaliar o desenho da
   * tela com o volume de uma operação já rodando.
   *
   * O padrão vem de `PAINEL_USA_DADOS_DE_EXEMPLO`, em dadosDemo.ts — é lá que
   * se desliga isso de vez. A URL manda em cima do padrão nos dois sentidos,
   * então dá para ver os dados reais sem publicar nada: `?demo=0`.
   *
   * Ligado, a chamada à API nem sai.
   */
  const parametroDemo = parametrosUrl.get('demo');
  const demo = parametroDemo === null ? PAINEL_USA_DADOS_DE_EXEMPLO : parametroDemo === '1';

  const {
    data: dadosApi,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard-manutencao', filtros],
    queryFn: () => dashboardManutencaoApi.carregar(filtros),
    staleTime: 60_000,
    enabled: !demo,
    // Sem isto, trocar um filtro derruba `data` para undefined e a tela volta ao
    // esqueleto — inclusive os próprios combos, que vivem dentro dos dados.
    placeholderData: keepPreviousData,
  });

  const data = demo ? DADOS_DEMO : dadosApi;

  const opcoesPlanta = useMemo(
    () => [
      { value: 'all', label: 'Todas as plantas' },
      ...(data?.opcoes.plantas ?? []).map((p) => ({ value: p.id, label: p.nome })),
    ],
    [data],
  );

  const opcoesUnidade = useMemo(
    () => [
      { value: 'all', label: 'Todas as instalações' },
      ...(data?.opcoes.unidades ?? []).map((u) => ({ value: u.id, label: u.nome })),
    ],
    [data],
  );

  const opcoesEquipe = useMemo(
    () => [
      { value: 'all', label: 'Todas as equipes' },
      ...(data?.opcoes.equipes ?? []).map((e) => ({ value: e, label: e })),
    ],
    [data],
  );

  /** Séries mensais no formato que o recharts espera: um objeto por mês. */
  const serieMensal = useMemo(() => {
    if (!data) return [];
    return data.meses.map((mes, i) => ({
      mes,
      maoObra: data.custo.maoObra[i] ?? 0,
      material: data.custo.material[i] ?? 0,
      terceiros: data.custo.terceiros[i] ?? 0,
      orcado: data.custo.orcado[i] ?? 0,
      corretiva: data.custoPorOS.corretiva[i] ?? 0,
      preventiva: data.custoPorOS.preventiva[i] ?? 0,
      manutencao: data.finalidade.manutencao[i] ?? 0,
      servicos: data.finalidade.servicos[i] ?? 0,
      resolvida: data.anomalias.resolvida[i] ?? 0,
      emExecucao: data.anomalias.emExecucao[i] ?? 0,
      semOS: data.anomalias.semOS[i] ?? 0,
      planejado: data.hh.planejado[i] ?? 0,
      apontado: data.hh.apontado[i] ?? 0,
    }));
  }, [data]);

  const temFiltroAtivo =
    ['plantaId', 'unidadeId', 'equipe', 'criticidade'].some(
      (k) => filtros[k as keyof FiltrosDashboard] && filtros[k as keyof FiltrosDashboard] !== 'all',
    ) || filtros.periodo !== '12meses';

  if (isLoading && !demo) {
    return (
      <Layout>
        <Layout.Main>
          <div className="flex h-full w-full flex-col gap-2">
            <Skeleton className="h-9 w-full rounded" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[68px] rounded" />
              ))}
            </div>
            <Skeleton className="min-h-[240px] w-full flex-1 rounded" />
          </div>
        </Layout.Main>
      </Layout>
    );
  }

  if ((isError && !demo) || !data) {
    return (
      <Layout>
        <Layout.Main>
          <div className="flex w-full flex-col items-center gap-3 rounded border border-border bg-card p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{formatApiError(error)}</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar de novo
            </Button>
          </div>
        </Layout.Main>
      </Layout>
    );
  }

  const ep = data.execucaoPlano;
  const pctPlano = ep.programadas > 0 ? Math.round((ep.executadas / ep.programadas) * 100) : 0;
  const a = data.anomalias;
  const pctBase = (n: number) => (a.identificadas > 0 ? Math.round((n / a.identificadas) * 100) : 0);

  return (
    <Layout>
      <Layout.Main className="2xl:overflow-hidden">
        {/* A raiz só vira "uma tela" a partir de 2xl; abaixo disso segue como
            fluxo normal e a página rola. */}
        <div className="flex w-full flex-col gap-2 2xl:h-full 2xl:min-h-0">
          {/* ---------- CABEÇALHO E FILTROS, NA MESMA LINHA ---------- */}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="mr-1 shrink-0 text-base font-semibold text-foreground">
              Painel de manutenção
            </h1>

            <div className="w-[calc(50%-0.25rem)] sm:w-40">
              <Combobox
                options={PERIODOS}
                value={filtros.periodo}
                onValueChange={(v) => setFiltros((f) => ({ ...f, periodo: (v as Periodo) || '12meses' }))}
                placeholder="Período"
                searchPlaceholder="Buscar período..."
                emptyText="Nenhum período."
              />
            </div>

            <div className="w-[calc(50%-0.25rem)] sm:w-44">
              <Combobox
                options={opcoesPlanta}
                value={filtros.plantaId ?? 'all'}
                // Trocar de planta invalida a unidade escolhida: ela pode
                // pertencer à planta anterior e o painel voltaria vazio.
                onValueChange={(v) =>
                  setFiltros((f) => ({ ...f, plantaId: v || 'all', unidadeId: 'all' }))
                }
                placeholder="Planta"
                searchPlaceholder="Buscar planta..."
                emptyText="Nenhuma planta."
              />
            </div>

            <div className="w-[calc(50%-0.25rem)] sm:w-44">
              <Combobox
                options={opcoesUnidade}
                value={filtros.unidadeId ?? 'all'}
                onValueChange={(v) => setFiltros((f) => ({ ...f, unidadeId: v || 'all' }))}
                placeholder="Instalação"
                searchPlaceholder="Buscar instalação..."
                emptyText="Nenhuma instalação."
              />
            </div>

            <div className="w-[calc(50%-0.25rem)] sm:w-40">
              <Combobox
                options={CRITICIDADES}
                value={filtros.criticidade ?? 'all'}
                onValueChange={(v) => setFiltros((f) => ({ ...f, criticidade: v || 'all' }))}
                placeholder="Criticidade"
                searchPlaceholder="Buscar criticidade..."
                emptyText="Nenhuma criticidade."
              />
            </div>

            {/* O combo de equipe só aparece quando existe OS com time
                preenchido — hoje `time_equipe` está vazio em todas as ordens, e
                um filtro que só sabe zerar a tela não ajuda ninguém. */}
            {opcoesEquipe.length > 1 && (
              <div className="w-[calc(50%-0.25rem)] sm:w-40">
                <Combobox
                  options={opcoesEquipe}
                  value={filtros.equipe ?? 'all'}
                  onValueChange={(v) => setFiltros((f) => ({ ...f, equipe: v || 'all' }))}
                  placeholder="Equipe"
                  searchPlaceholder="Buscar equipe..."
                  emptyText="Nenhuma equipe."
                />
              </div>
            )}

            {temFiltroAtivo && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => setFiltros({ periodo: '12meses' })}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Limpar
              </Button>
            )}

            {/* O aviso ocupa o lugar do horário: não faz sentido dizer
                "atualizado às 14h" sobre número inventado.

                Ele é fixo e não se fecha de propósito. O painel está publicado
                e qualquer pessoa da operação pode abrir esta tela; número
                inventado sem aviso é pior do que gráfico vazio. */}
            {demo ? (
              <span className="ml-auto flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                Dados de exemplo, não são reais — os filtros não alteram o exemplo. Abra{' '}
                <code className="font-mono">?demo=0</code> para ver os dados da operação.
              </span>
            ) : (
              <span className="ml-auto hidden items-center gap-1.5 text-[10px] text-muted-foreground lg:flex">
                <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
                {new Date(data.atualizadoEm).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>

          {/* ---------- 1 · INDICADORES ---------- */}
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-8">
            {data.kpis.map((k) => (
              <CartaoIndicador key={k.id} indicador={k} />
            ))}
          </div>

          {/* ---------- 2 A 6 · GRÁFICOS ---------- */}
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3 2xl:min-h-0 2xl:flex-1 2xl:grid-cols-12 2xl:grid-rows-3">
            {/* linha 1 — aderência ao plano */}
            <Quadro
              titulo="Execução do plano"
              subtitulo={`meta ${ep.meta}%`}
              className={`${ALTURA_PADRAO} 2xl:col-span-4`}
            >
              {/* O número sai de dentro do furo da rosca.
                  Centralizado, ele dependia de o furo ser maior que a linha de
                  texto — e o furo encolhe junto com a moldura, então em altura
                  apertada o percentual invadia o anel e a legenda de baixo era
                  cortada. Ao lado, a rosca encolhe sem levar o número junto. */}
              <div className="flex h-full items-center gap-3">
                <div className="aspect-square h-full shrink-0">
                  <Grafico>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Executadas', value: pctPlano },
                          { name: 'Pendentes', value: 100 - pctPlano },
                        ]}
                        dataKey="value"
                        innerRadius="66%"
                        outerRadius="96%"
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        <Cell fill={pctPlano >= ep.meta ? COR.verde : COR.ambar} />
                        <Cell fill={COR.trilho} />
                      </Pie>
                    </PieChart>
                  </Grafico>
                </div>

                <div className="min-w-0">
                  <p
                    className="text-lg font-medium leading-none"
                    style={{ color: pctPlano >= ep.meta ? COR.verde : COR.ambar }}
                  >
                    {pctPlano}%
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {ep.executadas} de {ep.programadas}
                  </p>
                </div>
              </div>
            </Quadro>

            <Quadro
              titulo="Planejada vs. não planejada"
              subtitulo="ref. 80/20"
              className={`${ALTURA_PADRAO} 2xl:col-span-4`}
              legenda={[
                { rotulo: 'Planejada', cor: COR.azul },
                { rotulo: 'Não planejada', cor: COR.laranja },
              ]}
            >
              <div className="flex h-full items-center gap-3">
                <div className="aspect-square h-full shrink-0">
                  <Grafico>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Planejada', value: data.planejadaVsNao.planejada },
                          { name: 'Não planejada', value: data.planejadaVsNao.naoPlanejada },
                        ]}
                        dataKey="value"
                        innerRadius="66%"
                        outerRadius="96%"
                        stroke="none"
                      >
                        <Cell fill={COR.azul} />
                        <Cell fill={COR.laranja} />
                      </Pie>
                      <Tooltip content={<DicaGrafico sufixo="%" />} />
                    </PieChart>
                  </Grafico>
                </div>

                {/* Os dois lados do mesmo tamanho: tamanhos diferentes davam a
                    impressão de que um número importava mais que o outro,
                    quando a leitura útil é justamente a proporção entre eles. */}
                <div className="min-w-0">
                  <p className="text-lg font-medium leading-none text-foreground">
                    {data.planejadaVsNao.planejada}
                    <span className="text-muted-foreground">
                      {' / '}
                      {data.planejadaVsNao.naoPlanejada}
                    </span>
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    plan. / não plan.
                  </p>
                </div>
              </div>
            </Quadro>

            <Quadro titulo="Origem da OS" className={`${ALTURA_PADRAO} 2xl:col-span-4`}>
              <div className="flex h-full items-center gap-3">
                <div className="aspect-square h-full shrink-0">
                  <Grafico>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Plano', value: data.origemOS.plano },
                          { name: 'Anomalia', value: data.origemOS.anomalia },
                          { name: 'Solicitação', value: data.origemOS.solicitacao },
                        ]}
                        dataKey="value"
                        innerRadius="66%"
                        outerRadius="96%"
                        stroke="none"
                      >
                        <Cell fill={COR.azul} />
                        <Cell fill={COR.laranja} />
                        <Cell fill={COR.ambar} />
                      </Pie>
                      <Tooltip content={<DicaGrafico sufixo="%" />} />
                    </PieChart>
                  </Grafico>
                </div>

                {/* A legenda desce do cabeçalho para cá: com o percentual ao
                    lado de cada origem ela deixa de ser só um decodificador de
                    cor e passa a ser a própria leitura do gráfico. */}
                <div className="flex min-w-0 flex-col gap-1 text-[11px] text-muted-foreground">
                  {[
                    { rotulo: 'Plano', valor: data.origemOS.plano, cor: COR.azul },
                    { rotulo: 'Anomalia', valor: data.origemOS.anomalia, cor: COR.laranja },
                    { rotulo: 'Solicitação', valor: data.origemOS.solicitacao, cor: COR.ambar },
                  ].map((o) => (
                    <span key={o.rotulo} className="flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-sm"
                        style={{ background: o.cor }}
                      />
                      <span className="truncate">{o.rotulo}</span>
                      <span className="ml-auto pl-1 text-foreground">{o.valor}%</span>
                    </span>
                  ))}
                </div>
              </div>
            </Quadro>

            {/* DESLIGADO — Mix por tipo de manutenção.
                Para reativar, tirar este comentário e devolver as colunas: as
                três roscas acima voltam a col-span-3 e a grade a grid-rows-4.

            <Quadro
              titulo="Mix por tipo"
              subtitulo="alvo: prev.+pred. > 70%"
              className={`${ALTURA_PADRAO} 2xl:col-span-3`}
              legenda={[
                { rotulo: `Prev. ${data.mixTipo.preventiva}%`, cor: COR.azul },
                { rotulo: `Pred. ${data.mixTipo.preditiva}%`, cor: COR.verde },
                { rotulo: `Corr. ${data.mixTipo.corretiva}%`, cor: COR.vermelho },
                { rotulo: `Insp. ${data.mixTipo.melhoria}%`, cor: COR.violeta },
              ]}
            >
              <div className="flex h-full items-center">
                <div className="h-10 w-full">
                  <Grafico>
                    <BarChart layout="vertical" data={[{ ...data.mixTipo, nome: 'mix' }]}>
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis type="category" dataKey="nome" hide />
                      <Tooltip content={<DicaGrafico sufixo="%" />} />
                      <Bar dataKey="preventiva" name="Preventiva" stackId="m" fill={COR.azul} />
                      <Bar dataKey="preditiva" name="Preditiva" stackId="m" fill={COR.verde} />
                      <Bar dataKey="corretiva" name="Corretiva" stackId="m" fill={COR.vermelho} />
                      <Bar
                        dataKey="melhoria"
                        name="Inspeção e visita"
                        stackId="m"
                        fill={COR.violeta}
                        radius={[0, 3, 3, 0]}
                      />
                    </BarChart>
                  </Grafico>
                </div>
              </div>
            </Quadro>
            */}

            {/* linha 2 — custo */}
            <Quadro
              titulo="Custo de manutenção"
              subtitulo="tracejado = orçado"
              className={`${ALTURA_PADRAO} 2xl:col-span-8`}
              simulado={data.custo.simulado}
              pendencia={data.custo.pendencia}
              legenda={[
                { rotulo: 'Mão de obra', cor: COR.azul },
                { rotulo: 'Material', cor: COR.laranja },
                { rotulo: 'Terceiros', cor: COR.verde },
              ]}
            >
              <Grafico>
                <ComposedChart data={serieMensal} margin={{ top: 4, right: 4 }}>
                  <CartesianGrid vertical={false} {...grade} />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={eixo} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={eixo}
                    tickFormatter={moedaMil}
                    width={58}
                  />
                  <Tooltip content={<DicaGrafico />} />
                  <Bar dataKey="maoObra" name="Mão de obra" stackId="c" fill={COR.azul} maxBarSize={24} />
                  <Bar dataKey="material" name="Material" stackId="c" fill={COR.laranja} maxBarSize={24} />
                  <Bar
                    dataKey="terceiros"
                    name="Terceiros"
                    stackId="c"
                    fill={COR.verde}
                    maxBarSize={24}
                    radius={[3, 3, 0, 0]}
                  />
                  <Line
                    dataKey="orcado"
                    name="Orçado"
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 4"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </Grafico>
            </Quadro>

            <Quadro
              titulo="Custo médio por OS"
              className={`${ALTURA_PADRAO} 2xl:col-span-4`}
              pendencia={data.custoPorOS.pendencia}
              legenda={
                data.custoPorOS.base === 0
                  ? undefined
                  : [
                      { rotulo: 'Corretiva', cor: COR.vermelho },
                      { rotulo: 'Preventiva', cor: COR.azul },
                    ]
              }
            >
              {data.custoPorOS.base === 0 ? (
                <SemDado mensagem="Nenhuma OS concluída tem custo lançado no período." />
              ) : (
                <Grafico>
                  <LineChart data={serieMensal} margin={{ top: 4, right: 4 }}>
                    <CartesianGrid vertical={false} {...grade} />
                    <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={eixo} />
                    <YAxis tickLine={false} axisLine={false} tick={eixo} width={48} />
                    <Tooltip content={<DicaGrafico />} />
                    <Line dataKey="corretiva" name="Corretiva" stroke={COR.vermelho} strokeWidth={2} dot={false} />
                    <Line
                      dataKey="preventiva"
                      name="Preventiva"
                      stroke={COR.azul}
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                    />
                  </LineChart>
                </Grafico>
              )}
            </Quadro>

            {/* DESLIGADO — Manutenção vs. serviços.
                Era simulado: não existe campo de finalidade na OS. Para
                reativar, tirar o comentário e devolver "Custo de manutenção" a
                col-span-6 e "Custo médio por OS" a col-span-3.

            <Quadro
              titulo="Manutenção vs. serviços"
              className={`${ALTURA_PADRAO} 2xl:col-span-3`}
              simulado={data.finalidade.simulado}
              pendencia={data.finalidade.pendencia}
              legenda={[
                { rotulo: 'Manutenção', cor: COR.violeta },
                { rotulo: 'Serviços', cor: COR.ambar },
              ]}
            >
              <Grafico>
                <BarChart data={serieMensal} margin={{ top: 4, right: 4 }}>
                  <CartesianGrid vertical={false} {...grade} />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={eixo} />
                  <YAxis tickLine={false} axisLine={false} tick={eixo} width={28} />
                  <Tooltip content={<DicaGrafico />} />
                  <Bar dataKey="manutencao" name="Manutenção" stackId="f" fill={COR.violeta} maxBarSize={20} />
                  <Bar
                    dataKey="servicos"
                    name="Serviços"
                    stackId="f"
                    fill={COR.ambar}
                    maxBarSize={20}
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </Grafico>
            </Quadro>
            */}

            {/* linha 3 — anomalias e horas */}
            <Quadro
              titulo="Anomalias"
              subtitulo="por mês de registro, não de fechamento"
              className={`${ALTURA_PADRAO} md:col-span-2 xl:col-span-3 2xl:col-span-8`}
              legenda={[
                { rotulo: 'Resolvida', cor: COR.verde },
                { rotulo: 'OS em execução', cor: COR.azul },
                { rotulo: 'Sem OS aberta', cor: COR.laranja },
              ]}
              acao={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[10px]"
                  onClick={() => navigate('/anomalias')}
                >
                  ver
                  <ChevronRight className="ml-0.5 h-3 w-3" />
                </Button>
              }
            >
              <div className="flex h-full min-h-0 gap-3">
                {/* O funil é uma leitura de números, não de forma: quatro
                    estatísticas ocupam menos altura e dizem mais que um gráfico
                    de funil desenhado. */}
                <div className="grid w-40 shrink-0 grid-cols-2 gap-1.5">
                  <Estatistica rotulo="Identificadas" valor={a.identificadas} nota="base" />
                  <Estatistica
                    rotulo="Viraram OS"
                    valor={a.viraramOS}
                    nota={`${pctBase(a.viraramOS)}%`}
                  />
                  <Estatistica
                    rotulo="Concluídas"
                    valor={a.concluidas}
                    nota={`${pctBase(a.concluidas)}%`}
                    destaque
                  />
                  <Estatistica
                    rotulo="Ciclo"
                    valor={String(a.cicloTotal).replace('.', ',')}
                    nota={`meta ${a.metaCiclo} d`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <Grafico>
                    <BarChart data={serieMensal} margin={{ top: 4, right: 4 }}>
                      <CartesianGrid vertical={false} {...grade} />
                      <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={eixo} />
                      <YAxis tickLine={false} axisLine={false} tick={eixo} width={28} allowDecimals={false} />
                      <Tooltip content={<DicaGrafico />} />
                      <Bar dataKey="resolvida" name="Resolvida" stackId="a" fill={COR.verde} maxBarSize={22} />
                      <Bar dataKey="emExecucao" name="OS em execução" stackId="a" fill={COR.azul} maxBarSize={22} />
                      <Bar
                        dataKey="semOS"
                        name="Sem OS aberta"
                        stackId="a"
                        fill={COR.laranja}
                        maxBarSize={22}
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </Grafico>
                </div>
              </div>
            </Quadro>

            <Quadro
              titulo="HH planejado vs. apontado"
              className={`${ALTURA_PADRAO} 2xl:col-span-4`}
              legenda={[
                { rotulo: 'Planejado', cor: COR.azulPalido },
                { rotulo: 'Apontado', cor: COR.azul },
              ]}
            >
              <Grafico>
                <BarChart data={serieMensal} margin={{ top: 4, right: 4 }}>
                  <CartesianGrid vertical={false} {...grade} />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={eixo} />
                  <YAxis tickLine={false} axisLine={false} tick={eixo} width={32} />
                  <Tooltip content={<DicaGrafico sufixo=" h" />} />
                  <Bar dataKey="planejado" name="Planejado" fill={COR.azulPalido} radius={[2, 2, 0, 0]} maxBarSize={9} />
                  <Bar dataKey="apontado" name="Apontado" fill={COR.azul} radius={[2, 2, 0, 0]} maxBarSize={9} />
                </BarChart>
              </Grafico>
            </Quadro>

            {/* DESLIGADA — linha 4 inteira: backlog, ofensores e prazo por equipe.
                Ofensores e prazo não tinham base de cálculo (nenhuma OS com
                custo lançado, nenhuma com equipe registrada) e viviam mostrando
                a caixa de "sem dado". Para reativar, tirar o comentário e voltar
                a grade para grid-rows-4.

            <Quadro
              titulo="Envelhecimento do backlog"
              subtitulo="OS em aberto por faixa de dias"
              className={`${ALTURA_PADRAO} 2xl:col-span-4`}
            >
              <Grafico>
                <BarChart layout="vertical" data={data.backlogIdade} margin={{ left: 4, right: 8 }}>
                  <CartesianGrid horizontal={false} {...grade} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={eixo} allowDecimals={false} />
                  <YAxis type="category" dataKey="faixa" tickLine={false} axisLine={false} tick={eixo} width={58} />
                  <Tooltip content={<DicaGrafico />} />
                  <Bar dataKey="qtd" name="OS" radius={[0, 3, 3, 0]} maxBarSize={20}>
                    {data.backlogIdade.map((f, i) => (
                      <Cell
                        key={f.faixa}
                        fill={[COR.azulPalido, COR.azulClaro, COR.azul, COR.laranja, COR.vermelho][i]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </Grafico>
            </Quadro>

            <Quadro
              titulo="Maiores ofensores"
              subtitulo="top 5 por custo"
              className={`${ALTURA_PADRAO} 2xl:col-span-4`}
            >
              {data.ofensores.length === 0 ? (
                <SemDado mensagem="Nenhuma OS com custo lançado e equipamento vinculado no período." />
              ) : (
                <Grafico>
                  <BarChart layout="vertical" data={data.ofensores} margin={{ left: 4, right: 8 }}>
                    <CartesianGrid horizontal={false} {...grade} />
                    <XAxis type="number" tickLine={false} axisLine={false} tick={eixo} tickFormatter={moedaMil} />
                    <YAxis type="category" dataKey="ativo" tickLine={false} axisLine={false} tick={eixo} width={92} />
                    <Tooltip content={<DicaGrafico />} />
                    <Bar dataKey="custoMil" name="Custo" fill={COR.azul} radius={[0, 3, 3, 0]} maxBarSize={20} />
                  </BarChart>
                </Grafico>
              )}
            </Quadro>

            <Quadro
              titulo="OS no prazo, por equipe"
              subtitulo={`meta ${data.metaPrazo}%`}
              className={`${ALTURA_PADRAO} 2xl:col-span-4`}
              pendencia={data.prazoPendencia}
            >
              {data.prazoPorEquipe.length === 0 ? (
                <SemDado mensagem="Nenhuma OS tem equipe registrada." />
              ) : (
                <Grafico>
                  <BarChart layout="vertical" data={data.prazoPorEquipe} margin={{ left: 4, right: 8 }}>
                    <CartesianGrid horizontal={false} {...grade} />
                    <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={eixo} />
                    <YAxis type="category" dataKey="equipe" tickLine={false} axisLine={false} tick={eixo} width={92} />
                    <Tooltip content={<DicaGrafico sufixo="%" />} />
                    <Bar dataKey="pct" name="No prazo" radius={[0, 3, 3, 0]} maxBarSize={20}>
                      {data.prazoPorEquipe.map((e) => (
                        <Cell
                          key={e.equipe}
                          fill={
                            e.pct >= data.metaPrazo
                              ? COR.verde
                              : e.pct >= data.metaPrazo - 10
                                ? COR.ambar
                                : COR.vermelho
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </Grafico>
              )}
            </Quadro>
            */}
          </div>

          {/* DESLIGADA — faixa de alertas de qualidade e restrição.
              Dos cinco, três não tinham fonte no banco (retrabalho, parada não
              programada e aderência HH vinham marcados como simulados) e os
              outros dois ficavam zerados. O endpoint continua devolvendo
              `alertas`; para reativar, basta tirar este comentário.

          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {data.alertas.map((k) => (
              <CartaoIndicador key={k.id} indicador={k} />
            ))}
          </div>
          */}
        </div>
      </Layout.Main>
    </Layout>
  );
}

/** Número do funil de anomalias. Compacto porque são quatro lado a lado. */
function Estatistica({
  rotulo,
  valor,
  nota,
  destaque,
}: {
  rotulo: string;
  valor: string | number;
  nota: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col justify-center rounded-sm border border-border px-2 py-1">
      <span className="truncate text-[10px] leading-none text-muted-foreground">{rotulo}</span>
      <span
        className={`mt-1 text-sm font-medium leading-none ${
          destaque ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
        }`}
      >
        {valor}
      </span>
      <span className="mt-1 truncate text-[9px] leading-none text-muted-foreground">{nota}</span>
    </div>
  );
}
