import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { NavigationLink } from '@/features/navigation/utils/navigation-links';
import type { PosicaoPainel } from '@/features/navigation/hooks/usePainelFlutuante';
import { COR_ATIVA, COR_INATIVA } from '@/features/navigation/utils/menu-ativo';

interface PainelFlutuanteProps {
  grupo: NavigationLink;
  ativoKey: string | null;
  posicao: PosicaoPainel;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onNavegar: (path: string) => void;
  onAbrirMenu: () => void;
}

/**
 * Subitens de um grupo, ao lado do icone, com o menu recolhido. Vai num portal
 * no body para escapar do overflow da sidebar.
 */
export function PainelFlutuante({
  grupo,
  ativoKey,
  posicao,
  onMouseEnter,
  onMouseLeave,
  onNavegar,
  onAbrirMenu,
}: PainelFlutuanteProps) {
  return createPortal(
    <div
      role="menu"
      aria-label={grupo.label}
      style={{ top: posicao.top, left: posicao.left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed z-[99999] min-w-[200px] max-w-[280px] overflow-hidden rounded-lg border border-border bg-card shadow-xl shadow-black/10 animate-in fade-in-0 slide-in-from-left-2 duration-150 ease-out dark:shadow-black/30"
    >
      <button
        type="button"
        onClick={onAbrirMenu}
        className="w-full px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        {grupo.label}
      </button>
      <div className="pb-1">
        {grupo.links?.map((sub) => {
          const ativo = sub.key === ativoKey;
          return (
            <button
              key={sub.key}
              type="button"
              role="menuitem"
              onClick={() => onNavegar(sub.path)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                ativo ? cn(COR_ATIVA, 'font-semibold') : COR_INATIVA,
              )}
            >
              <sub.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{sub.label}</span>
              {ativo && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-service-verde" />}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
