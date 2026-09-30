// src/features/programacao-os/components/AcoesDaProgramacao.tsx
import { Button } from '@/components/ui/button';
import {
  acoesDaProgramacao,
  type AcaoProgramacao,
  type ProgramacaoParaAcoes,
  type TemPermissao,
} from '../config/actions-config';

interface AcoesDaProgramacaoProps {
  programacao: ProgramacaoParaAcoes;
  modo: 'view' | 'edit';
  onAcao: (acao: AcaoProgramacao) => void;
  /** Esconde a ação cuja permissão o usuário não tem (o backend daria 403) */
  temPermissao?: TemPermissao;
  /**
   * No editar, com mudança não salva: as ações ficam desabilitadas — aprovar ou
   * cancelar fecha o sheet e descartaria o que foi digitado (decisão D4 da
   * SPEC-ATALHOS-E-ACOES-DA-OS).
   */
  alteracoesPendentes?: boolean;
}

/**
 * As ações que o status da programação permite, no topo do sheet — em
 * visualizar e em editar. Antes aprovar e cancelar só existiam na linha da
 * tabela, e o painel de confirmação aparecia no fim do formulário.
 */
export function AcoesDaProgramacao({
  programacao,
  modo,
  onAcao,
  temPermissao,
  alteracoesPendentes = false,
}: AcoesDaProgramacaoProps) {
  const acoes = acoesDaProgramacao(programacao, modo, temPermissao);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Ações</h3>

      {acoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Programação encerrada: nenhuma ação disponível.
        </p>
      ) : (
        <>
          {alteracoesPendentes && (
            <p className="text-sm text-muted-foreground">
              Salve as alterações antes de aprovar, cancelar ou excluir.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {acoes.map(({ acao, label, descricao, icon: Icon, variant }) => (
              <Button
                key={acao}
                type="button"
                size="sm"
                variant={variant === 'destructive' ? 'outline' : 'default'}
                className={variant === 'destructive' ? 'text-destructive hover:text-destructive' : undefined}
                title={descricao}
                disabled={alteracoesPendentes}
                onClick={() => onAcao(acao)}
              >
                <Icon className="h-4 w-4 mr-1.5" />
                {label}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
