// src/features/solicitacoes-servico/components/table-cells/SolicitacaoInfoCell.tsx
import { SolicitacaoServico } from '../../types';

interface SolicitacaoInfoCellProps {
  solicitacao: SolicitacaoServico;
}

export function SolicitacaoInfoCell({ solicitacao }: SolicitacaoInfoCellProps) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">{solicitacao.numero}</span>
      </div>
      <div className="font-medium text-sm text-foreground line-clamp-1">{solicitacao.titulo}</div>
      {solicitacao.descricao && (
        <div className="text-xs text-muted-foreground line-clamp-2">{solicitacao.descricao}</div>
      )}
    </div>
  );
}
