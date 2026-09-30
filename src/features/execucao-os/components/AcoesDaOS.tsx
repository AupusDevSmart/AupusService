// src/features/execucao-os/components/AcoesDaOS.tsx
import { Button } from '@/components/ui/button';
import { acoesDisponiveis, type TemPermissao } from '../config/actions-config';
import type { PendingAction } from './ActionConfirmPanel';

interface AcoesDaOSProps {
  status: string | undefined;
  onAcao: (acao: PendingAction) => void;
  /** Esconde a acao cuja permissao o usuario nao tem (o backend daria 403) */
  temPermissao?: TemPermissao;
  /**
   * No editar, com mudanca nao salva: as acoes ficam desabilitadas. A transicao
   * fecha o sheet e descartaria o que foi digitado (decisao D4 da
   * SPEC-ATALHOS-E-ACOES-DA-OS).
   */
  alteracoesPendentes?: boolean;
}

/**
 * As acoes que o status atual da OS permite, clicaveis.
 *
 * Substitui o antigo StatusTransitionHelper, que listava as transicoes como
 * texto sem botao nenhum — e, montado dentro do formulario, nunca recebia o
 * status real: o BaseForm nao repassa a entidade para campo custom, entao ele
 * caia sempre em PENDENTE e mostrava "Iniciar" ate numa OS finalizada.
 *
 * Clicar abre o mesmo painel de confirmacao das acoes da tabela.
 */
export function AcoesDaOS({ status, onAcao, temPermissao, alteracoesPendentes = false }: AcoesDaOSProps) {
  const acoes = acoesDisponiveis(status, temPermissao);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Ações</h3>

      {acoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          OS encerrada: nenhuma ação disponível.
        </p>
      ) : (
        <>
        {alteracoesPendentes && (
          <p className="text-sm text-muted-foreground">
            Salve as alterações antes de mudar o status.
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
