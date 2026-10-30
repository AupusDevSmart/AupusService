// src/core/components/common/base-modal/SecaoRecolhivel.tsx
import { useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/core/lib/utils';

interface SecaoRecolhivelProps {
  titulo: string;
  /** O que a seção diz quando fechada (e ao lado do título quando aberta) */
  resumo?: ReactNode;
  /** Controlada (o BaseForm abre a que tem erro); sem `aberta`, a seção guarda o próprio estado */
  aberta?: boolean;
  onAlternar?: (aberta: boolean) => void;
  abertaInicial?: boolean;
  /** A primeira não leva o traço de cima */
  primeira?: boolean;
  children: ReactNode;
}

/**
 * Uma parte do sheet que recolhe (30/out/2026, pedido do usuário: "layout muito
 * desorganizado"). O título é o botão; fechada, mostra o resumo. O conteúdo fica
 * montado quando recolhido (`hidden`): o rascunho e o que foi digitado nele não
 * se perdem ao fechar.
 */
export function SecaoRecolhivel({ titulo, resumo, aberta, onAlternar, abertaInicial = true, primeira = false, children }: SecaoRecolhivelProps) {
  const [abertaLocal, setAbertaLocal] = useState(abertaInicial);
  const estaAberta = aberta ?? abertaLocal;
  const alternar = () => {
    if (aberta === undefined) setAbertaLocal(!estaAberta);
    onAlternar?.(!estaAberta);
  };

  return (
    <section className={cn(!primeira && 'border-t border-border')}>
      <button type="button" onClick={alternar} aria-expanded={estaAberta} className="flex w-full items-center gap-2 py-3.5 text-left">
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', estaAberta && 'rotate-90')} />
        <span className="shrink-0 text-sm font-semibold text-foreground">{titulo}</span>
        {resumo && <span className="ml-auto min-w-0 truncate pl-3 text-right text-xs text-muted-foreground">{resumo}</span>}
      </button>
      <div hidden={!estaAberta} className="pb-6 pt-1">
        {children}
      </div>
    </section>
  );
}
