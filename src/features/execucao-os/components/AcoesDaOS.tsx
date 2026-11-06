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
  /**
   * Acoes que ficam em outro lugar do sheet. O Executar da OS em andamento fica
   * no fim, depois de "O que foi feito" (06/nov/2026): no topo, convidava a
   * concluir antes de marcar o que foi feito.
   */
  ocultar?: PendingAction[];
  /** Uma linha abaixo dos botoes (onde esta a acao que saiu daqui) */
  aviso?: string;
  /**
   * Outro painel de acao aberto no sheet (o Concluir, no fim): os botoes ficam
   * desabilitados com o motivo. Trocar de acao desmontava o painel e apagava,
   * calado, o que estava digitado nele.
   */
  bloqueadas?: string;
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
export function AcoesDaOS({ status, onAcao, temPermissao, alteracoesPendentes = false, ocultar = [], aviso, bloqueadas }: AcoesDaOSProps) {
  const todas = acoesDisponiveis(status, temPermissao);
  const acoes = todas.filter((a) => !ocultar.includes(a.acao));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Ações</h3>

      {todas.length === 0 ? (
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
        {bloqueadas && !alteracoesPendentes && <p className="text-sm text-muted-foreground">{bloqueadas}</p>}
        <div className="flex flex-wrap gap-2">
          {acoes.map(({ acao, label, descricao, icon: Icon, variant }) => (
            <Button
              key={acao}
              type="button"
              size="sm"
              variant={variant === 'destructive' ? 'outline' : 'default'}
              className={variant === 'destructive' ? 'text-destructive hover:text-destructive' : undefined}
              title={descricao}
              disabled={alteracoesPendentes || !!bloqueadas}
              onClick={() => onAcao(acao)}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {label}
            </Button>
          ))}
        </div>
        {aviso && <p className="text-xs text-muted-foreground">{aviso}</p>}
        </>
      )}
    </div>
  );
}
