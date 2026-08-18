// src/features/dashboard/components/PainelPrimitivos.tsx
import * as Icones from 'lucide-react';
import { Info } from 'lucide-react';
import type { IndicadorApi } from '@/services/dashboard-manutencao.services';

/**
 * Peças visuais do painel de manutenção.
 *
 * Tudo em tokens do design system (bg-card, border-border, text-muted-foreground)
 * e raio pequeno — nada de canto muito arredondado, seguindo o resto do produto.
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
    <div className="rounded border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icone className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{indicador.rotulo}</span>

        {/* O aviso de simulado fica no card, não numa legenda de rodapé: quem
            lê o número precisa saber na hora que ele não é real. */}
        {indicador.simulado && (
          <span
            className="ml-auto shrink-0 rounded-sm border border-border px-1 text-[10px] uppercase tracking-wide text-muted-foreground"
            title={indicador.pendencia}
          >
            simulado
          </span>
        )}
      </div>

      <div
        className={`mt-1 text-2xl font-medium leading-tight ${
          semDado ? 'text-muted-foreground' : 'text-foreground'
        }`}
      >
        {indicador.valor}
        {indicador.unidade && !semDado && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">{indicador.unidade}</span>
        )}
      </div>

      <div
        className={`mt-1 flex items-start gap-1 text-[11px] ${
          indicador.status ? COR_STATUS[indicador.status] : 'text-muted-foreground'
        }`}
      >
        <span className="min-w-0">{indicador.nota}</span>
        {indicador.pendencia && !indicador.simulado && (
          <Info className="h-3 w-3 shrink-0 text-muted-foreground" aria-label={indicador.pendencia} />
        )}
      </div>
    </div>
  );
}

export function TituloSecao({
  children,
  icone: Icone,
}: {
  children: React.ReactNode;
  icone: React.ComponentType<{ className?: string }>;
}) {
  return (
    <h2 className="mb-3 mt-7 flex items-center gap-2 border-b border-border pb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
      <Icone className="h-3.5 w-3.5" />
      {children}
    </h2>
  );
}

export function Quadro({
  titulo,
  subtitulo,
  children,
  pendencia,
  simulado,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  pendencia?: string;
  simulado?: boolean;
  acao?: React.ReactNode;
}) {
  return (
    <div className="rounded border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{titulo}</p>
          {subtitulo && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitulo}</p>}
        </div>
        {simulado && (
          <span className="shrink-0 rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            simulado
          </span>
        )}
      </div>

      <div className="mt-3">{children}</div>

      {/* A pendência fica embaixo do gráfico, não no lugar dele: o desenho
          continua servindo para validar a tela, e o texto diz o que falta
          registrar para o número virar real. */}
      {pendencia && (
        <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-2 text-[11px] text-muted-foreground">
          <Info className="mt-px h-3 w-3 shrink-0" />
          <span>{pendencia}</span>
        </p>
      )}

      {acao && <div className="mt-3">{acao}</div>}
    </div>
  );
}

/** Quando não há o que desenhar — lista vazia, sem base de cálculo. */
export function SemDado({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex h-full min-h-[140px] items-center justify-center rounded-sm border border-dashed border-border px-4 text-center text-xs text-muted-foreground">
      {mensagem}
    </div>
  );
}

export function Legenda({ itens }: { itens: { rotulo: string; cor: string }[] }) {
  return (
    <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
      {itens.map((i) => (
        <span key={i.rotulo} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: i.cor }} />
          {i.rotulo}
        </span>
      ))}
    </div>
  );
}
