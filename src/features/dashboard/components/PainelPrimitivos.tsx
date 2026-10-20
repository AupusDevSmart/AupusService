// src/features/dashboard/components/PainelPrimitivos.tsx
import * as Icones from 'lucide-react';
import { Calculator, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { IndicadorApi } from '@/services/dashboard-manutencao.services';

/**
 * Peças visuais do painel de manutenção.
 *
 * Tudo em tokens do design system (bg-card, border-border, text-muted-foreground)
 * e raio pequeno — nada de canto muito arredondado, seguindo o resto do produto.
 *
 * As peças são dimensionadas para caber: a partir de 2xl o painel inteiro ocupa
 * uma tela só, então cada elemento gasta o mínimo de altura e cresce junto com o
 * espaço que sobrar, em vez de ter altura fixa.
 */

/** Mapeia o nome do ícone que o backend manda para o componente do Lucide. */
const ICONES: Record<string, React.ComponentType<{ className?: string }>> = {
  'calendar-check': Icones.CalendarCheck,
  'folder-open': Icones.FolderOpen,
  'circle-check': Icones.CircleCheck,
  stack: Icones.Layers,
  'alert-triangle': Icones.AlertTriangle,
  activity: Icones.Activity,
  clock: Icones.Clock,
  plug: Icones.Plug,
  rotate: Icones.RotateCw,
  repeat: Icones.Repeat,
  'package-off': Icones.PackageX,
  pause: Icones.Pause,
  checklist: Icones.ListChecks,
};

const COR_STATUS: Record<string, string> = {
  ok: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-500',
  bad: 'text-destructive',
};

/** O que explica um número: a fórmula, a base e a pendência */
type Explicacao = Pick<IndicadorApi, 'formula' | 'base' | 'pendencia'>;

/** O que a legenda lista: um cartão ou um gráfico */
type NumeroExplicado = Pick<IndicadorApi, 'id' | 'rotulo'> & Explicacao;

/**
 * Como o número sai: a fórmula, a base (em quantos registros ele se apoia) e o
 * que falta para deixar de ser simulado. Na dica do cartão e na seção "Como
 * cada número é calculado" (SN-80).
 */
function ExplicacaoDoIndicador({ indicador }: { indicador: Explicacao }) {
  return (
    <div className="space-y-1">
      {indicador.formula && <p>{indicador.formula}</p>}
      {indicador.base && <p className="text-muted-foreground">{indicador.base}</p>}
      {indicador.pendencia && <p className="text-muted-foreground">{indicador.pendencia}</p>}
    </div>
  );
}

/** O ícone de informação que abre a explicação. Popover, não dica: a dica do Radix não abre por toque e fecha no clique */
function BotaoDaExplicacao({ rotulo, explicacao }: { rotulo: string; explicacao: Explicacao }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center rounded-sm text-muted-foreground hover:text-foreground"
          aria-label={`Como se calcula: ${rotulo}`}
          title="Como se calcula"
        >
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 text-xs">
        <ExplicacaoDoIndicador indicador={explicacao} />
      </PopoverContent>
    </Popover>
  );
}

export function CartaoIndicador({ indicador }: { indicador: IndicadorApi }) {
  const Icone = ICONES[indicador.icone] ?? Icones.Circle;
  const semDado = indicador.valor === '—';
  const temExplicacao = Boolean(indicador.formula || indicador.base || indicador.pendencia);

  return (
    <div className="flex min-w-0 flex-col justify-center rounded border border-border bg-card px-2.5 py-2">
      <div className="flex items-center gap-1 text-[11px] leading-none text-muted-foreground">
        <Icone className="h-3 w-3 shrink-0" />
        <span className="truncate">{indicador.rotulo}</span>

        <span className="ml-auto flex shrink-0 items-center gap-1">
          {/* O aviso de simulado fica no card, não numa legenda de rodapé: quem
              lê o número precisa saber na hora que ele não é real. */}
          {indicador.simulado && (
            <span className="rounded-sm border border-border px-1 text-[9px] uppercase leading-[14px] tracking-wide">sim</span>
          )}
          {temExplicacao && <BotaoDaExplicacao rotulo={indicador.rotulo} explicacao={indicador} />}
        </span>
      </div>

      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={`text-xl font-medium leading-none ${
            semDado ? 'text-muted-foreground' : 'text-foreground'
          }`}
        >
          {indicador.valor}
        </span>
        {indicador.unidade && !semDado && (
          <span className="text-[10px] text-muted-foreground">{indicador.unidade}</span>
        )}
      </div>

      <div
        className={`mt-1 truncate text-[10px] leading-none ${
          indicador.status ? COR_STATUS[indicador.status] : 'text-muted-foreground'
        }`}
      >
        {indicador.nota}
      </div>
    </div>
  );
}

/**
 * Moldura de um gráfico.
 *
 * O cabeçalho é de uma linha só — título, subtítulo e legenda dividem a mesma
 * faixa. Doze molduras na tela: cada linha extra de cabeçalho custaria mais de
 * cem pixels do espaço que os gráficos precisam.
 *
 * A pendência (o que falta registrar para o número virar real) vira o ícone de
 * informação à direita, com o texto no hover, em vez de um parágrafo no rodapé.
 */
export function Quadro({
  titulo,
  subtitulo,
  children,
  pendencia,
  explicacao,
  simulado,
  legenda,
  acao,
  className = '',
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  pendencia?: string;
  /** A fórmula e a base do gráfico (SN-81): abrem no ícone de informação, como no cartão */
  explicacao?: Pick<IndicadorApi, 'formula' | 'base'>;
  simulado?: boolean;
  legenda?: { rotulo: string; cor: string }[];
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded border border-border bg-card p-3 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <p className="shrink-0 text-xs font-medium text-foreground">{titulo}</p>
        {subtitulo && (
          <span className="truncate text-[10px] text-muted-foreground">{subtitulo}</span>
        )}

        {legenda && <Legenda itens={legenda} className="ml-auto" />}

        <div className={`flex shrink-0 items-center gap-1.5 ${legenda ? '' : 'ml-auto'}`}>
          {simulado && (
            <span className="rounded-sm border border-border px-1 text-[9px] uppercase leading-[14px] tracking-wide text-muted-foreground">
              simulado
            </span>
          )}
          {explicacao?.formula || explicacao?.base ? (
            <BotaoDaExplicacao rotulo={titulo} explicacao={{ ...explicacao, pendencia }} />
          ) : (
            pendencia && (
              <span title={pendencia} className="flex items-center">
                <Info className="h-3 w-3 text-muted-foreground" />
              </span>
            )
          )}
          {acao}
        </div>
      </div>

      <div className="mt-2 min-h-0 flex-1">{children}</div>
    </div>
  );
}

/** Quando não há o que desenhar — lista vazia, sem base de cálculo. */
export function SemDado({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex h-full min-h-[60px] items-center justify-center rounded-sm border border-dashed border-border px-3 text-center text-[11px] leading-snug text-muted-foreground">
      {mensagem}
    </div>
  );
}

export function Legenda({
  itens,
  className = '',
}: {
  itens: { rotulo: string; cor: string }[];
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-wrap justify-end gap-x-2.5 gap-y-0.5 text-[10px] leading-tight text-muted-foreground ${className}`}
    >
      {itens.map((i) => (
        <span key={i.rotulo} className="flex items-center gap-1 whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-sm" style={{ background: i.cor }} />
          {i.rotulo}
        </span>
      ))}
    </div>
  );
}

/**
 * A legenda das fórmulas (SN-80/81): cada cartão e cada gráfico, com a fórmula
 * e em quantos registros o número se baseia. Atrás de um botão discreto no
 * cabeçalho, num painel lateral — a tela fica limpa, e quem quer saber de onde
 * sai um número acha tudo num lugar só. Cada cartão e gráfico também tem o
 * ícone de informação com a sua.
 */
export function LegendaDasFormulas({
  indicadores,
  graficos,
}: {
  indicadores: NumeroExplicado[];
  graficos: NumeroExplicado[];
}) {
  const secoes = [
    { titulo: 'Indicadores', itens: indicadores.filter((i) => i.formula) },
    { titulo: 'Gráficos', itens: graficos.filter((i) => i.formula) },
  ].filter((secao) => secao.itens.length > 0);
  if (secoes.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" title="Como cada número é calculado">
          <Calculator className="mr-1 h-3.5 w-3.5" />
          Como se calcula
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <div className="border-b px-5 py-4 pr-12">
          <SheetTitle className="text-base">Como se calcula</SheetTitle>
          <SheetDescription className="text-xs">
            A fórmula de cada número do painel e em quantos registros ele se baseia, com os filtros escolhidos.
          </SheetDescription>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4 text-xs">
          {secoes.map((secao) => (
            <section key={secao.titulo}>
              <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{secao.titulo}</h3>
              <dl className="space-y-3">
                {secao.itens.map((item) => (
                  <div key={item.id} className="min-w-0">
                    <dt className="font-medium text-foreground">{item.rotulo}</dt>
                    <dd className="mt-0.5 text-muted-foreground">
                      <ExplicacaoDoIndicador indicador={item} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
