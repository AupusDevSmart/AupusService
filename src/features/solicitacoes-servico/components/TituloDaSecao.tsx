// src/features/solicitacoes-servico/components/TituloDaSecao.tsx
import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DicaDaConta, type Explicacao } from '@/components/common/ComoSeCalcula';
import { moeda } from '@/services/proposta.services';

/**
 * O título de uma parte da proposta (30/out/2026, pedido do usuário: menos borda,
 * mais hierarquia): rótulo pequeno em caixa alta, a legenda discreta e, à direita,
 * o quanto a parte soma e a ação dela. A separação entre as partes é o espaço,
 * não uma caixa em volta de cada uma.
 */
export function TituloDaSecao({ titulo, explicacao, valor, children }: { titulo: string; explicacao?: Explicacao; valor?: number | null; children?: ReactNode }) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-2">
      <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {titulo}
        {explicacao && <DicaDaConta {...explicacao} />}
      </h4>
      <div className="flex items-center gap-2">
        {valor !== undefined && valor !== null && <span className="text-sm font-medium tabular-nums">{moeda(valor)}</span>}
        {children}
      </div>
    </div>
  );
}

/** "+ Adicionar", em texto: o ícone sozinho não dizia o que fazia */
export function BotaoAdicionar({ onClick, rotulo = 'Adicionar', descricao }: { onClick: () => void; rotulo?: string; descricao: string }) {
  return (
    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={onClick} aria-label={descricao} title={descricao}>
      <Plus className="mr-1 h-3.5 w-3.5" />
      {rotulo}
    </Button>
  );
}
