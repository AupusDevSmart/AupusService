// src/features/execucao-os/components/AcoesDaOS.tsx
import { Button } from '@/components/ui/button';
import { acoesDisponiveis } from '../config/actions-config';
import type { PendingAction } from './ActionConfirmPanel';

interface AcoesDaOSProps {
  status: string | undefined;
  onAcao: (acao: PendingAction) => void;
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
export function AcoesDaOS({ status, onAcao }: AcoesDaOSProps) {
  const acoes = acoesDisponiveis(status);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Ações</h3>

      {acoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          OS encerrada: nenhuma ação disponível.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {acoes.map(({ acao, label, descricao, icon: Icon, variant }) => (
            <Button
              key={acao}
              type="button"
              size="sm"
              variant={variant === 'destructive' ? 'outline' : 'default'}
              className={variant === 'destructive' ? 'text-destructive hover:text-destructive' : undefined}
              title={descricao}
              onClick={() => onAcao(acao)}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
