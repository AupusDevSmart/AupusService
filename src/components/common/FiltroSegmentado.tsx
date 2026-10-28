// src/components/common/FiltroSegmentado.tsx
import { cn } from '@/lib/utils';

export type OpcaoDoFiltro<V> = {
  valor: V;
  rotulo: string;
};

interface FiltroSegmentadoProps<V> {
  opcoes: OpcaoDoFiltro<V>[];
  valor: V;
  onChange: (valor: V) => void;
  /** Rótulo acessível do grupo: o conjunto se anuncia como um */
  aria: string;
  className?: string;
}

/**
 * Grupo de filtros mutuamente exclusivos, um botão por opção — o filtro de
 * categoria da página de recursos do AupusProject. Todas as opções à vista e um
 * clique, em vez de abrir uma lista para ler o que há.
 *
 * O `flex-wrap` é o que importa: sem ele, em 360px as últimas opções saíam da
 * tela e ficavam inalcançáveis (nada na página rola na horizontal).
 */
export function FiltroSegmentado<V>({ opcoes, valor, onChange, aria, className }: FiltroSegmentadoProps<V>) {
  return (
    <div role="group" aria-label={aria} className={cn('flex flex-wrap gap-1 rounded-md border bg-card p-1', className)}>
      {opcoes.map((opcao) => {
        const ativo = Object.is(opcao.valor, valor);
        return (
          <button
            key={String(opcao.valor)}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(opcao.valor)}
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
              ativo ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opcao.rotulo}
          </button>
        );
      })}
    </div>
  );
}
