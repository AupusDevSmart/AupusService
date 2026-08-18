// src/features/dashboard/components/PainelPrimitivos.tsx
import * as Icones from 'lucide-react';
import { Info } from 'lucide-react';
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

export function CartaoIndicador({ indicador }: { indicador: IndicadorApi }) {
  const Icone = ICONES[indicador.icone] ?? Icones.Circle;
  const semDado = indicador.valor === '—';

  return (
    <div
      className="flex min-w-0 flex-col justify-center rounded border border-border bg-card px-2.5 py-2"
      title={indicador.pendencia}
    >
      <div className="flex items-center gap-1 text-[11px] leading-none text-muted-foreground">
        <Icone className="h-3 w-3 shrink-0" />
        <span className="truncate">{indicador.rotulo}</span>

        {/* O aviso de simulado fica no card, não numa legenda de rodapé: quem
            lê o número precisa saber na hora que ele não é real. */}
        {indicador.simulado && (
          <span className="ml-auto shrink-0 rounded-sm border border-border px-1 text-[9px] uppercase leading-[14px] tracking-wide">
            sim
          </span>
        )}
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
  simulado,
  legenda,
  acao,
  className = '',
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  pendencia?: string;
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
          {pendencia && (
            <span title={pendencia} className="flex items-center">
              <Info className="h-3 w-3 text-muted-foreground" />
            </span>
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
