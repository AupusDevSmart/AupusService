// src/features/solicitacoes-servico/hooks/useSolicitacoesActions.ts
import { useCallback, useState } from 'react';
import { solicitacoesServicoService } from '@/services/solicitacoes-servico.service';
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

  const handleEdit = useCallback(
    async (solicitacao: SolicitacaoServico) => {
      if (solicitacao.status !== 'REGISTRADA') {
        alert('Apenas solicitacoes registradas podem ser editadas.');
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
        alert('Apenas solicitacoes registradas podem ser excluidas.');
        return;
      }
      openViewWithAction(solicitacao, 'excluir');
    },
    [openViewWithAction]
  );

  const confirmAction = useCallback(
    async (_input?: string) => {
      if (!pendingAction || !actionEntity) return;

      try {
        if (pendingAction === 'excluir') {
          await deleteItem(actionEntity.id);
        }

        closeModal();
        clearPendingAction();
        await onSuccess();
      } catch (error) {
        console.error(`Erro ao executar acao ${pendingAction}:`, error);
        alert('Erro ao executar acao. Tente novamente.');
      }
    },
    [pendingAction, actionEntity, deleteItem, closeModal, clearPendingAction, onSuccess]
  );

  return {
    handleView,
    handleEdit,
    handleDelete,
    pendingAction,
    confirmAction,
    clearPendingAction,
  };
}
