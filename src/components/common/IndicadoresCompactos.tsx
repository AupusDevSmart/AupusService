import type { LucideIcon } from 'lucide-react';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TomIndicador = 'neutro' | 'atencao' | 'critico';

export interface Indicador {
  chave: string;
  rotulo: string;
  valor: number;
  icone: LucideIcon;
  /** So pinta quando o valor passa de zero: zero atrasadas nao e alerta. */
  tom?: TomIndicador;
  /** Presente, o indicador vira botao (ex.: filtrar a tabela por ele). */
  onClick?: () => void;
  dica?: string;
}

const COR_DO_TOM: Record<Exclude<TomIndicador, 'neutro'>, string> = {
  atencao: 'text-amber-600 dark:text-amber-400',
  critico: 'text-red-600 dark:text-red-400',
};

/**
 * Faixa de indicadores de uma pagina de listagem, em uma linha por item.
 *
 * Substitui os cards altos (icone em circulo + numero grande) e os avisos
 * "N ordens em atraso" logo abaixo deles: juntos comiam ~200px antes da tabela.
 * O aviso vira o proprio indicador, em destaque e clicavel para filtrar.
 */
export function IndicadoresCompactos({
  itens,
  carregando = false,
  className,
}: {
  itens: Indicador[];
  carregando?: boolean;
  className?: string;
}) {
  // Tres cabem lado a lado ate no celular; quatro quebram em duas linhas.
  const colunas = itens.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4';

  return (
    <div className={cn('grid gap-2', colunas, className)}>
      {itens.map(({ chave, rotulo, valor, icone: Icone, tom = 'neutro', onClick, dica }) => {
        const destacar = !carregando && tom !== 'neutro' && valor > 0;
        const cor = destacar ? COR_DO_TOM[tom as Exclude<TomIndicador, 'neutro'>] : undefined;
        const conteudo = (
          <>
            <Icone className={cn('h-4 w-4 shrink-0', cor ?? 'text-muted-foreground')} />
            <span className="min-w-0 truncate text-xs text-muted-foreground">{rotulo}</span>
            <span className={cn('ml-auto pl-2 text-sm font-semibold tabular-nums', cor ?? 'text-foreground')}>
              {carregando ? '-' : valor}
            </span>
            {onClick && <Filter aria-hidden className="h-3 w-3 shrink-0 text-muted-foreground" />}
          </>
        );
        const base = 'flex h-10 min-w-0 items-center gap-2 rounded-lg border bg-card px-3 text-left';

        return onClick ? (
          <button
            key={chave}
            type="button"
            onClick={onClick}
            title={dica ?? `Filtrar: ${rotulo}`}
            className={cn(base, 'transition-colors hover:border-service-verde hover:bg-muted')}
          >
            {conteudo}
          </button>
        ) : (
          <div key={chave} title={dica} className={base}>
            {conteudo}
          </div>
        );
      })}
    </div>
  );
}
