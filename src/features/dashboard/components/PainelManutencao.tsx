// src/features/dashboard/components/PainelManutencao.tsx
import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
import {
  Target,
  Banknote,
  AlertTriangle,
  Layers,
  Users,
  Bell,
  RefreshCw,
  ChevronRight,
  X,
} from 'lucide-react';
import { Layout } from '@/components/common/Layout';
import { TitleCard } from '@/components/common/title-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Combobox } from '@aupus/shared-pages';
import { formatApiError } from '@/utils/api-error';
import {
  dashboardManutencaoApi,
  type FiltrosDashboard,
} from '@/services/dashboard-manutencao.services';
import { CartaoIndicador, Legenda, Quadro, SemDado, TituloSecao } from './PainelPrimitivos';

/**
 * Painel de gestão de manutenção e serviços.
 *
 * A ordem dos blocos é a ordem da conversa de reunião de rotina: estamos bem →
 * cumprimos o plano → quanto custou → o que está travado. Quem tem trinta
 * segundos lê só a primeira faixa.
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

const PERIODOS = [
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

const moedaMil = (v: number) => `R$ ${v.toLocaleString('pt-BR')}k`;

/** Tooltip no visual do produto — o padrão do recharts destoa do resto. */
function DicaGrafico({ active, payload, label, sufixo }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded border border-border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-sm" style={{ background: p.color ?? p.fill }} />
          {p.name}: <span className="text-foreground">{p.value}{sufixo ?? ''}</span>
        </p>
      ))}
    </div>
  );
}

const eixo = { stroke: 'hsl(var(--muted-foreground))', fontSize: 11 };
const grade = { stroke: 'hsl(var(--border))' };

export function PainelManutencao() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState<FiltrosDashboard>({ periodo: '12meses' });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-manutencao', filtros],
    queryFn: () => dashboardManutencaoApi.carregar(filtros),
    staleTime: 60_000,
    // Sem isto, trocar um filtro derruba `data` para undefined e a tela volta ao
    // esqueleto — inclusive os próprios combos, que vivem dentro dos dados.
    placeholderData: keepPreviousData,
  });

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

  const temFiltroAtivo = ['plantaId', 'unidadeId', 'equipe', 'criticidade'].some(
    (k) => filtros[k as keyof FiltrosDashboard] && filtros[k as keyof FiltrosDashboard] !== 'all',
  ) || filtros.periodo !== '12meses';

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

  const irPara = (destino: string) => navigate(destino);

  if (isLoading) {
    return (
      <Layout>
        <Layout.Main>
          <div className="w-full">
            <TitleCard title="Painel de manutenção" description="Carregando indicadores..." />
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[88px] rounded" />
              ))}
            </div>
            <Skeleton className="mt-6 h-64 w-full rounded" />
          </div>
        </Layout.Main>
      </Layout>
    );
  }

  if (isError || !data) {
    return (
      <Layout>
        <Layout.Main>
          <div className="w-full">
            <TitleCard title="Painel de manutenção" description="Não foi possível carregar" />
            <div className="flex flex-col items-center gap-3 rounded border border-border bg-card p-10 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{formatApiError(error)}</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar de novo
              </Button>
            </div>
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
      <Layout.Main>
        <div className="flex h-full w-full flex-col">
          <TitleCard
            title="Painel de manutenção e serviços"
            description="Aderência ao plano, custo, anomalias e backlog"
          />

          {/* ---------- FILTROS ---------- */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-48">
              <Combobox
                options={PERIODOS}
                value={filtros.periodo}
                onValueChange={(v) => setFiltros((f) => ({ ...f, periodo: (v || '12meses') as any }))}
                placeholder="Período"
                searchPlaceholder="Buscar período..."
                emptyText="Nenhum período."
              />
            </div>

            <div className="w-full sm:w-52">
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

            <div className="w-full sm:w-52">
              <Combobox
                options={opcoesUnidade}
                value={filtros.unidadeId ?? 'all'}
                onValueChange={(v) => setFiltros((f) => ({ ...f, unidadeId: v || 'all' }))}
                placeholder="Instalação"
                searchPlaceholder="Buscar instalação..."
                emptyText="Nenhuma instalação."
              />
            </div>

            <div className="w-full sm:w-48">
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
              <div className="w-full sm:w-48">
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
              <Button variant="ghost" size="sm" onClick={() => setFiltros({ periodo: '12meses' })}>
                <X className="mr-1 h-3.5 w-3.5" />
                Limpar
              </Button>
            )}

            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
              atualizado{' '}
              {new Date(data.atualizadoEm).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* ---------- 1 · INDICADORES ---------- */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
            {data.kpis.map((k) => (
              <CartaoIndicador key={k.id} indicador={k} />
            ))}
          </div>

          {/* ---------- 2 · ADERÊNCIA ---------- */}
          <TituloSecao icone={Target}>Aderência ao plano e origem da demanda</TituloSecao>
          <div className="grid gap-3 lg:grid-cols-3">
            <Quadro titulo="Execução do plano" subtitulo={`Concluídas sobre programadas · meta ${ep.meta}%`}>
              <div className="relative h-[168px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Executadas', value: pctPlano },
                        { name: 'Pendentes', value: 100 - pctPlano },
                      ]}
                      dataKey="value"
                      innerRadius="72%"
                      outerRadius="100%"
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      <Cell fill={pctPlano >= ep.meta ? COR.verde : COR.ambar} />
                      <Cell fill={COR.trilho} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-2xl font-medium"
                    style={{ color: pctPlano >= ep.meta ? COR.verde : COR.ambar }}
                  >
                    {pctPlano}%
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {ep.executadas} de {ep.programadas}
                  </span>
                </div>
              </div>
            </Quadro>

            <Quadro titulo="Planejada vs. não planejada" subtitulo="Referência de classe mundial: 80/20">
              <div className="relative h-[168px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Planejada', value: data.planejadaVsNao.planejada },
                        { name: 'Não planejada', value: data.planejadaVsNao.naoPlanejada },
                      ]}
                      dataKey="value"
                      innerRadius="72%"
                      outerRadius="100%"
                      stroke="none"
                    >
                      <Cell fill={COR.azul} />
                      <Cell fill={COR.laranja} />
                    </Pie>
                    <Tooltip content={<DicaGrafico sufixo="%" />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-medium text-foreground">
                    {data.planejadaVsNao.planejada}
                    <span className="text-base text-muted-foreground">/{data.planejadaVsNao.naoPlanejada}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">plan. / não plan.</span>
                </div>
              </div>
            </Quadro>

            <Quadro titulo="Origem da OS" subtitulo="Campo obrigatório — evita dupla contagem">
              <div className="h-[168px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Plano', value: data.origemOS.plano },
                        { name: 'Anomalia', value: data.origemOS.anomalia },
                        { name: 'Solicitação', value: data.origemOS.solicitacao },
                      ]}
                      dataKey="value"
                      innerRadius="72%"
                      outerRadius="100%"
                      stroke="none"
                    >
                      <Cell fill={COR.azul} />
                      <Cell fill={COR.laranja} />
                      <Cell fill={COR.ambar} />
                    </Pie>
                    <Tooltip content={<DicaGrafico sufixo="%" />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <Legenda
                itens={[
                  { rotulo: `Plano ${data.origemOS.plano}%`, cor: COR.azul },
                  { rotulo: `Anomalia ${data.origemOS.anomalia}%`, cor: COR.laranja },
                  { rotulo: `Solicitação ${data.origemOS.solicitacao}%`, cor: COR.ambar },
                ]}
              />
            </Quadro>
          </div>

          <div className="mt-3">
            <Quadro titulo="Mix por tipo de manutenção" subtitulo="Alvo: preventiva + preditiva acima de 70%">
              <Legenda
                itens={[
                  { rotulo: `Preventiva ${data.mixTipo.preventiva}%`, cor: COR.azul },
                  { rotulo: `Preditiva ${data.mixTipo.preditiva}%`, cor: COR.verde },
                  { rotulo: `Corretiva ${data.mixTipo.corretiva}%`, cor: COR.vermelho },
                  { rotulo: `Inspeção e visita ${data.mixTipo.melhoria}%`, cor: COR.violeta },
                ]}
              />
              <div className="h-[64px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={[{ ...data.mixTipo, nome: 'mix' }]}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="nome" hide />
                    <Tooltip content={<DicaGrafico sufixo="%" />} />
                    <Bar dataKey="preventiva" name="Preventiva" stackId="m" fill={COR.azul} />
                    <Bar dataKey="preditiva" name="Preditiva" stackId="m" fill={COR.verde} />
                    <Bar dataKey="corretiva" name="Corretiva" stackId="m" fill={COR.vermelho} />
                    <Bar dataKey="melhoria" name="Inspeção e visita" stackId="m" fill={COR.violeta} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Quadro>
          </div>

          {/* ---------- 3 · CUSTO ---------- */}
          <TituloSecao icone={Banknote}>Custo</TituloSecao>
          <Quadro
            titulo="Custo de manutenção — 12 meses"
            subtitulo="Composição por natureza · linha tracejada = orçado"
            simulado={data.custo.simulado}
            pendencia={data.custo.pendencia}
          >
            <Legenda
              itens={[
                { rotulo: 'Mão de obra', cor: COR.azul },
                { rotulo: 'Material e peças', cor: COR.laranja },
                { rotulo: 'Terceiros', cor: COR.verde },
              ]}
            />
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serieMensal}>
                  <CartesianGrid vertical={false} {...grade} />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={eixo} />
                  <YAxis tickLine={false} axisLine={false} tick={eixo} tickFormatter={moedaMil} width={64} />
                  <Tooltip content={<DicaGrafico />} />
                  <Bar dataKey="maoObra" name="Mão de obra" stackId="c" fill={COR.azul} maxBarSize={26} />
                  <Bar dataKey="material" name="Material" stackId="c" fill={COR.laranja} maxBarSize={26} />
                  <Bar dataKey="terceiros" name="Terceiros" stackId="c" fill={COR.verde} maxBarSize={26} radius={[3, 3, 0, 0]} />
                  <Line
                    dataKey="orcado"
                    name="Orçado"
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 4"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Quadro>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <Quadro
              titulo="Custo médio por OS"
              subtitulo="Corretiva contra preventiva · R$ por ordem"
              pendencia={data.custoPorOS.pendencia}
            >
              {data.custoPorOS.base === 0 ? (
                <SemDado mensagem="Nenhuma OS concluída tem custo lançado no período." />
              ) : (
                <>
                  <Legenda
                    itens={[
                      { rotulo: 'Corretiva', cor: COR.vermelho },
                      { rotulo: 'Preventiva', cor: COR.azul },
                    ]}
                  />
                  <div className="h-[208px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={serieMensal}>
                        <CartesianGrid vertical={false} {...grade} />
                        <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={eixo} />
                        <YAxis tickLine={false} axisLine={false} tick={eixo} width={64} />
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
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </Quadro>

            <Quadro
              titulo="Manutenção vs. serviços"
              subtitulo="Volume de OS por finalidade"
              simulado={data.finalidade.simulado}
              pendencia={data.finalidade.pendencia}
            >
              <Legenda
                itens={[
                  { rotulo: 'Manutenção', cor: COR.violeta },
                  { rotulo: 'Serviços', cor: COR.ambar },
                ]}
              />
              <div className="h-[208px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serieMensal}>
                    <CartesianGrid vertical={false} {...grade} />
                    <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={eixo} />
                    <YAxis tickLine={false} axisLine={false} tick={eixo} width={36} />
                    <Tooltip content={<DicaGrafico />} />
                    <Bar dataKey="manutencao" name="Manutenção" stackId="f" fill={COR.violeta} maxBarSize={22} />
                    <Bar dataKey="servicos" name="Serviços" stackId="f" fill={COR.ambar} maxBarSize={22} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Quadro>
          </div>

          {/* ---------- 4 · ANOMALIAS ---------- */}
          <TituloSecao icone={AlertTriangle}>Anomalias — do apontamento à OS concluída</TituloSecao>
          <Quadro
            titulo="Funil e coorte de registro"
            subtitulo="Cada barra é o mês em que a anomalia nasceu, não o mês em que foi fechada"
            acao={
              <Button variant="outline" size="sm" onClick={() => irPara('/anomalias')}>
                Ver anomalias
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            }
          >
            <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <div className="rounded border border-border p-3">
                <p className="text-xs text-muted-foreground">Identificadas</p>
                <p className="mt-1 text-2xl font-medium text-foreground">{a.identificadas}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">base do funil</p>
              </div>
              <div className="rounded border border-border p-3">
                <p className="text-xs text-muted-foreground">Viraram OS</p>
                <p className="mt-1 text-2xl font-medium text-foreground">{a.viraramOS}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{pctBase(a.viraramOS)}% da base</p>
              </div>
              <div className="rounded border border-border p-3">
                <p className="text-xs text-muted-foreground">OS concluída</p>
                <p className="mt-1 text-2xl font-medium text-emerald-600 dark:text-emerald-400">{a.concluidas}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{pctBase(a.concluidas)}% da base</p>
              </div>
              <div className="rounded border border-border p-3">
                <p className="text-xs text-muted-foreground">Ciclo total</p>
                <p className="mt-1 text-2xl font-medium text-foreground">
                  {String(a.cicloTotal).replace('.', ',')}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">dias</span>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {String(a.cicloAteOS).replace('.', ',')} d até abrir · meta {a.metaCiclo} d
                </p>
              </div>
            </div>

            <Legenda
              itens={[
                { rotulo: 'Resolvida', cor: COR.verde },
                { rotulo: 'OS em execução', cor: COR.azul },
                { rotulo: 'Sem OS aberta', cor: COR.laranja },
              ]}
            />
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serieMensal}>
                  <CartesianGrid vertical={false} {...grade} />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={eixo} />
                  <YAxis tickLine={false} axisLine={false} tick={eixo} width={36} allowDecimals={false} />
                  <Tooltip content={<DicaGrafico />} />
                  <Bar dataKey="resolvida" name="Resolvida" stackId="a" fill={COR.verde} maxBarSize={24} />
                  <Bar dataKey="emExecucao" name="OS em execução" stackId="a" fill={COR.azul} maxBarSize={24} />
                  <Bar dataKey="semOS" name="Sem OS aberta" stackId="a" fill={COR.laranja} maxBarSize={24} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Quadro>

          {/* ---------- 5 · BACKLOG ---------- */}
          <TituloSecao icone={Layers}>Backlog e ofensores</TituloSecao>
          <div className="grid gap-3 lg:grid-cols-2">
            <Quadro titulo="Envelhecimento do backlog" subtitulo="OS em aberto por faixa de dias">
              <div className="h-[228px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={data.backlogIdade} margin={{ left: 12 }}>
                    <CartesianGrid horizontal={false} {...grade} />
                    <XAxis type="number" tickLine={false} axisLine={false} tick={eixo} allowDecimals={false} />
                    <YAxis type="category" dataKey="faixa" tickLine={false} axisLine={false} tick={eixo} width={70} />
                    <Tooltip content={<DicaGrafico />} />
                    <Bar dataKey="qtd" name="OS" radius={[0, 3, 3, 0]} maxBarSize={24}>
                      {data.backlogIdade.map((f, i) => (
                        <Cell
                          key={f.faixa}
                          fill={[COR.azulPalido, COR.azulClaro, COR.azul, COR.laranja, COR.vermelho][i]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Quadro>

            <Quadro titulo="Maiores ofensores" subtitulo="Top 5 ativos por custo acumulado">
              {data.ofensores.length === 0 ? (
                <SemDado mensagem="Nenhuma OS com custo lançado e equipamento vinculado no período." />
              ) : (
                <div className="h-[228px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data.ofensores} margin={{ left: 12 }}>
                      <CartesianGrid horizontal={false} {...grade} />
                      <XAxis type="number" tickLine={false} axisLine={false} tick={eixo} tickFormatter={moedaMil} />
                      <YAxis type="category" dataKey="ativo" tickLine={false} axisLine={false} tick={eixo} width={110} />
                      <Tooltip content={<DicaGrafico />} />
                      <Bar dataKey="custoMil" name="Custo" fill={COR.azul} radius={[0, 3, 3, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Quadro>
          </div>

          {/* ---------- 6 · PRODUTIVIDADE ---------- */}
          <TituloSecao icone={Users}>Produtividade e cumprimento de prazo</TituloSecao>
          <div className="grid gap-3 lg:grid-cols-2">
            <Quadro
              titulo="OS concluídas no prazo, por equipe"
              subtitulo={`Meta ${data.metaPrazo}%`}
              pendencia={data.prazoPendencia}
            >
              {data.prazoPorEquipe.length === 0 ? (
                <SemDado mensagem="Nenhuma OS tem equipe registrada." />
              ) : (
                <div className="h-[228px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data.prazoPorEquipe} margin={{ left: 12 }}>
                      <CartesianGrid horizontal={false} {...grade} />
                      <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={eixo} />
                      <YAxis type="category" dataKey="equipe" tickLine={false} axisLine={false} tick={eixo} width={110} />
                      <Tooltip content={<DicaGrafico sufixo="%" />} />
                      <Bar dataKey="pct" name="No prazo" radius={[0, 3, 3, 0]} maxBarSize={24}>
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
                  </ResponsiveContainer>
                </div>
              )}
            </Quadro>

            <Quadro titulo="HH planejado vs. apontado" subtitulo="Estimado na OS contra duração real">
              <Legenda
                itens={[
                  { rotulo: 'Planejado', cor: COR.azulPalido },
                  { rotulo: 'Apontado', cor: COR.azul },
                ]}
              />
              <div className="h-[208px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serieMensal}>
                    <CartesianGrid vertical={false} {...grade} />
                    <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={eixo} />
                    <YAxis tickLine={false} axisLine={false} tick={eixo} width={40} />
                    <Tooltip content={<DicaGrafico sufixo=" h" />} />
                    <Bar dataKey="planejado" name="Planejado" fill={COR.azulPalido} radius={[2, 2, 0, 0]} maxBarSize={11} />
                    <Bar dataKey="apontado" name="Apontado" fill={COR.azul} radius={[2, 2, 0, 0]} maxBarSize={11} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Quadro>
          </div>

          {/* ---------- 7 · ALERTAS ---------- */}
          <TituloSecao icone={Bell}>Alertas de qualidade e restrição</TituloSecao>
          <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {data.alertas.map((k) => (
              <CartaoIndicador key={k.id} indicador={k} />
            ))}
          </div>
        </div>
      </Layout.Main>
    </Layout>
  );
}
