// src/features/solicitacoes-servico/hooks/useSolicitacoesActions.ts
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { solicitacoesServicoService } from '@/services/solicitacoes-servico.service';
import { propostaApi } from '@/services/proposta.services';
import { formatApiError } from '@/utils/api-error';
import { SolicitacaoServico } from '../types';
import { PendingAction } from '../components/ActionConfirmPanel';

interface UseSolicitacoesActionsProps {
  openModal: (mode: 'create' | 'edit' | 'view', entity?: SolicitacaoServico) => void;
  closeModal: () => void;
  deleteItem: (id: string) => Promise<void>;
  onSuccess: () => void | Promise<void>;
}

export function useSolicitacoesActions({
  openModal,
  closeModal,
  deleteItem,
  onSuccess,
}: UseSolicitacoesActionsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionEntity, setActionEntity] = useState<SolicitacaoServico | null>(null);

  const openViewWithAction = useCallback(
    async (solicitacao: SolicitacaoServico, action: PendingAction) => {
      try {
        const complete = await solicitacoesServicoService.findOne(solicitacao.id);
        setActionEntity(complete as SolicitacaoServico);
        setPendingAction(action);
        openModal('view', complete as SolicitacaoServico);
      } catch (error) {
        console.error('Erro ao buscar solicitacao completa:', error);
        setActionEntity(solicitacao);
        setPendingAction(action);
        openModal('view', solicitacao);
      }
    },
    [openModal]
  );

  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
    setActionEntity(null);
  }, []);

  const handleView = useCallback(
    async (solicitacao: SolicitacaoServico) => {
      clearPendingAction();
      try {
        const complete = await solicitacoesServicoService.findOne(solicitacao.id);
        openModal('view', complete as SolicitacaoServico);
      } catch (error) {
        console.error('[ACTIONS] handleView - Erro no findOne, usando dados da lista:', error);
        openModal('view', solicitacao);
      }
    },
    [openModal, clearPendingAction]
  );

  /** Abre pelo id, vindo de um link (notificação). Sem a linha da lista para cair, o erro sobe. */
  const abrirPorId = useCallback(
    async (id: string) => {
      clearPendingAction();
      openModal('view', await solicitacoesServicoService.findOne(id.trim()));
    },
    [openModal, clearPendingAction]
  );

  const handleEdit = useCallback(
    async (solicitacao: SolicitacaoServico) => {
      if (solicitacao.status !== 'REGISTRADA') {
        alert('Apenas solicitações registradas podem ser editadas.');
        return;
      }
      clearPendingAction();
      try {
        const complete = await solicitacoesServicoService.findOne(solicitacao.id);
        openModal('edit', complete as SolicitacaoServico);
      } catch (error) {
        console.error('[ACTIONS] handleEdit - Erro no findOne, usando dados da lista:', error);
        openModal('edit', solicitacao);
      }
    },
    [openModal, clearPendingAction]
  );

  const handleDelete = useCallback(
    (solicitacao: SolicitacaoServico) => {
      if (solicitacao.status !== 'REGISTRADA') {
        alert('Apenas solicitações registradas podem ser excluídas.');
        return;
      }
      openViewWithAction(solicitacao, 'excluir');
    },
    [openViewWithAction]
  );

  // A revisão da proposta (29/out/2026): revisar, reabrir e não aprovada, pelo sheet aberto
  const handleRevisar = useCallback((solicitacao: SolicitacaoServico) => openViewWithAction(solicitacao, 'revisar'), [openViewWithAction]);
  const handleReabrir = useCallback((solicitacao: SolicitacaoServico) => openViewWithAction(solicitacao, 'reabrir'), [openViewWithAction]);
  const handleNaoAprovada = useCallback((solicitacao: SolicitacaoServico) => openViewWithAction(solicitacao, 'nao_aprovada'), [openViewWithAction]);

  const confirmAction = useCallback(
    async (input?: string) => {
      if (!pendingAction || !actionEntity) return;
      const id = String(actionEntity.id).trim();

      try {
        if (pendingAction === 'excluir') await deleteItem(id);
        if (pendingAction === 'revisar') await propostaApi.revisar(id);
        if (pendingAction === 'reabrir') await propostaApi.reabrir(id, input);
        if (pendingAction === 'nao_aprovada') await propostaApi.naoAprovada(id, input ?? '');
        if (pendingAction !== 'excluir') {
          toast.success({ revisar: 'Proposta revisada: já pode ser programada', reabrir: 'Proposta reaberta para edição', nao_aprovada: 'Proposta marcada como não aprovada' }[pendingAction]);
        }

        closeModal();
        clearPendingAction();
        await onSuccess();
      } catch (error) {
        console.error(`Erro ao executar ação ${pendingAction}:`, error);
        toast.error('Não foi possível concluir a ação', { description: formatApiError(error) });
      }
    },
    [pendingAction, actionEntity, deleteItem, closeModal, clearPendingAction, onSuccess]
  );

  return {
    handleView,
    abrirPorId,
    handleEdit,
    handleDelete,
    handleRevisar,
    handleReabrir,
    handleNaoAprovada,
    pendingAction,
    confirmAction,
    clearPendingAction,
  };
}
