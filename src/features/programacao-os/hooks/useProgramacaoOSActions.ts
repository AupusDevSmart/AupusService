// src/features/programacao-os/hooks/useProgramacaoOSActions.ts

import { useState, useCallback } from 'react';
import type { ProgramacaoResponse, ProgramacaoDetalhesResponse } from '@/services/programacao-os.service';

interface UseProgramacaoOSActionsProps {
  openModal: (mode: 'create' | 'edit' | 'view', entity?: any, preselectedData?: any) => void;
  fetchOne: (id: string) => Promise<ProgramacaoDetalhesResponse>;
  deleteItem: (id: string) => Promise<void>;
  aprovar: (id: string, observacoes?: string) => Promise<any>;
  finalizar: (id: string, observacoes?: string) => Promise<any>;
  cancelar: (id: string, motivo: string) => Promise<any>;
  onSuccess: () => void;
}

/**
 * Hook customizado para ações da tabela de Programação de OS
 * Fluxo: PENDENTE -> APROVADA -> FINALIZADA, e PENDENTE/APROVADA -> CANCELADA
 */
export function useProgramacaoOSActions({
  openModal,
  fetchOne,
  deleteItem,
  aprovar,
  finalizar,
  cancelar,
  onSuccess,
}: UseProgramacaoOSActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [workflowAction, setWorkflowAction] = useState<'aprovar' | 'finalizar' | 'cancelar' | null>(null);
  const [selectedProgramacao, setSelectedProgramacao] = useState<ProgramacaoResponse | null>(null);

  // ============================================================================
  // AÇÕES BÁSICAS (VIEW, EDIT, DELETE)
  // ============================================================================

  const handleView = useCallback(async (programacao: ProgramacaoResponse) => {
    try {
      setLoading(true);
      const dadosCompletos = await fetchOne(programacao.id);
      openModal('view', dadosCompletos);
    } catch (error) {
      console.error('Erro ao carregar dados completos:', error);
      openModal('view', programacao);
    } finally {
      setLoading(false);
    }
  }, [fetchOne, openModal]);

  const handleEdit = useCallback(async (programacao: ProgramacaoResponse) => {
    if (programacao.status !== 'PENDENTE') {
      alert('Apenas programacoes pendentes podem ser editadas');
      return;
    }

    try {
      setLoading(true);
      const dadosCompletos = await fetchOne(programacao.id);
      openModal('edit', dadosCompletos);
    } catch (error) {
      console.error('Erro ao carregar dados completos:', error);
      openModal('edit', programacao);
    } finally {
      setLoading(false);
    }
  }, [fetchOne, openModal]);

  const handleDelete = useCallback(async (programacao: ProgramacaoResponse) => {
    if (programacao.status !== 'PENDENTE') {
      alert('Apenas programacoes pendentes podem ser deletadas');
      return;
    }

    const confirmacao = confirm(`Deseja deletar a programacao "${programacao.descricao}"?`);
    if (!confirmacao) return;

    try {
      setLoading(true);
      await deleteItem(programacao.id);
      onSuccess();
      alert('Programacao deletada com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar programacao. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [deleteItem, onSuccess]);

  // ============================================================================
  // AÇÕES DE WORKFLOW
  // ============================================================================

  const handleAprovar = useCallback(async (programacao: ProgramacaoResponse, observacoes?: string) => {
    if (programacao.status !== 'PENDENTE') {
      alert('Apenas programacoes pendentes podem ser aprovadas');
      return;
    }

    if (observacoes === undefined) {
      setSelectedProgramacao(programacao);
      setWorkflowAction('aprovar');
      setShowWorkflowModal(true);
      return;
    }

    try {
      setLoading(true);
      await aprovar(programacao.id, observacoes);
      onSuccess();
      setShowWorkflowModal(false);
      alert('Programacao aprovada com sucesso!');
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar programacao. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [aprovar, onSuccess]);

  const handleFinalizar = useCallback(async (programacao: ProgramacaoResponse, observacoes?: string) => {
    if (programacao.status !== 'APROVADA') {
      alert('Apenas programacoes aprovadas podem ser finalizadas');
      return;
    }

    if (observacoes === undefined) {
      setSelectedProgramacao(programacao);
      setWorkflowAction('finalizar');
      setShowWorkflowModal(true);
      return;
    }

    try {
      setLoading(true);
      await finalizar(programacao.id, observacoes);
      onSuccess();
      setShowWorkflowModal(false);
      alert('Programacao finalizada com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      alert('Erro ao finalizar programacao. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [finalizar, onSuccess]);

  const handleCancelar = useCallback(async (programacao: ProgramacaoResponse, motivo?: string) => {
    if (!['PENDENTE', 'APROVADA'].includes(programacao.status)) {
      alert('Esta programacao nao pode ser cancelada');
      return;
    }

    if (!motivo) {
      setSelectedProgramacao(programacao);
      setWorkflowAction('cancelar');
      setShowWorkflowModal(true);
      return;
    }

    try {
      setLoading(true);
      await cancelar(programacao.id, motivo);
      onSuccess();
      setShowWorkflowModal(false);
      alert('Programacao cancelada com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      alert('Erro ao cancelar programacao. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [cancelar, onSuccess]);

  const handleCloseWorkflowModal = useCallback(() => {
    setShowWorkflowModal(false);
    setWorkflowAction(null);
    setSelectedProgramacao(null);
  }, []);

  return {
    loading,

    // Ações básicas
    handleView,
    handleEdit,
    handleDelete,

    // Ações de workflow
    handleAprovar,
    handleFinalizar,
    handleCancelar,

    // Controle do modal de workflow
    showWorkflowModal,
    workflowAction,
    selectedProgramacao,
    handleCloseWorkflowModal,
  };
}
