// src/features/programacao-os/hooks/useProgramacaoOSActions.ts

import { useState, useCallback } from 'react';
import type { ProgramacaoResponse, ProgramacaoDetalhesResponse } from '@/services/programacao-os.service';

interface UseProgramacaoOSActionsProps {
  openModal: (mode: 'create' | 'edit' | 'view', entity?: any, preselectedData?: any) => void;
  fetchOne: (id: string) => Promise<ProgramacaoDetalhesResponse>;
  deleteItem: (id: string) => Promise<void>;
  analisar: (id: string, observacoes?: string) => Promise<any>;
  aprovar: (id: string, observacoes?: string, ajustes?: any) => Promise<any>;
  rejeitar: (id: string, motivo: string, sugestoes?: string) => Promise<any>;
  cancelar: (id: string, motivo: string) => Promise<any>;
  onSuccess: () => void;
}

/**
 * Hook customizado para ações da tabela de Programação de OS
 * Segue o padrão definido no FEATURE_REFACTORING_GUIDE.md
 */
export function useProgramacaoOSActions({
  openModal,
  fetchOne,
  deleteItem,
  analisar,
  aprovar,
  rejeitar,
  cancelar,
  onSuccess,
}: UseProgramacaoOSActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [workflowAction, setWorkflowAction] = useState<'analisar' | 'aprovar' | 'rejeitar' | 'cancelar' | null>(null);
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
      // Fallback: usar dados básicos
      openModal('view', programacao);
    } finally {
      setLoading(false);
    }
  }, [fetchOne, openModal]);

  const handleEdit = useCallback(async (programacao: ProgramacaoResponse) => {
    // Verificar se pode ser editada
    if (!['RASCUNHO', 'PENDENTE'].includes(programacao.status)) {
      alert('Apenas programações em rascunho ou pendentes podem ser editadas');
      return;
    }

    try {
      setLoading(true);
      const dadosCompletos = await fetchOne(programacao.id);
      openModal('edit', dadosCompletos);
    } catch (error) {
      console.error('Erro ao carregar dados completos:', error);
      // Fallback: usar dados básicos
      openModal('edit', programacao);
    } finally {
      setLoading(false);
    }
  }, [fetchOne, openModal]);

  const handleDelete = useCallback(async (programacao: ProgramacaoResponse) => {
    if (programacao.status === 'APROVADA') {
      alert('Programações aprovadas não podem ser deletadas');
      return;
    }

    const confirmacao = confirm(`Deseja deletar a programação "${programacao.descricao}"?`);
    if (!confirmacao) return;

    try {
      setLoading(true);
      await deleteItem(programacao.id);
      onSuccess();
      alert('Programação deletada com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar programação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [deleteItem, onSuccess]);

  // ============================================================================
  // AÇÕES DE WORKFLOW
  // ============================================================================

  const handleAnalisar = useCallback(async (programacao: ProgramacaoResponse, observacoes?: string) => {
    if (programacao.status !== 'PENDENTE') {
      alert('Apenas programações pendentes podem ser analisadas');
      return;
    }

    // Se não há observações, abrir modal para coletar
    if (observacoes === undefined) {
      setSelectedProgramacao(programacao);
      setWorkflowAction('analisar');
      setShowWorkflowModal(true);
      return;
    }

    try {
      setLoading(true);
      await analisar(programacao.id, observacoes);
      onSuccess();
      setShowWorkflowModal(false);
      alert('Programação enviada para análise com sucesso!');
    } catch (error) {
      console.error('Erro ao analisar:', error);
      alert('Erro ao iniciar análise. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [analisar, onSuccess]);

  const handleAprovar = useCallback(async (
    programacao: ProgramacaoResponse,
    observacoes?: string,
    ajustes?: any
  ) => {
    if (programacao.status !== 'EM_ANALISE') {
      alert('Apenas programações em análise podem ser aprovadas');
      return;
    }

    // Se não há dados, abrir modal
    if (observacoes === undefined && !ajustes) {
      setSelectedProgramacao(programacao);
      setWorkflowAction('aprovar');
      setShowWorkflowModal(true);
      return;
    }

    try {
      setLoading(true);
      await aprovar(programacao.id, observacoes, ajustes);
      onSuccess();
      setShowWorkflowModal(false);
      alert('Programação aprovada! Uma ordem de serviço foi gerada automaticamente.');
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar programação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [aprovar, onSuccess]);

  const handleRejeitar = useCallback(async (programacao: ProgramacaoResponse, motivo?: string, sugestoes?: string) => {
    if (programacao.status !== 'EM_ANALISE') {
      alert('Apenas programações em análise podem ser rejeitadas');
      return;
    }

    // Se não há motivo, abrir modal
    if (!motivo) {
      setSelectedProgramacao(programacao);
      setWorkflowAction('rejeitar');
      setShowWorkflowModal(true);
      return;
    }

    try {
      setLoading(true);
      await rejeitar(programacao.id, motivo, sugestoes);
      onSuccess();
      setShowWorkflowModal(false);
      alert('Programação rejeitada com sucesso!');
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      alert('Erro ao rejeitar programação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [rejeitar, onSuccess]);

  const handleCancelar = useCallback(async (programacao: ProgramacaoResponse, motivo?: string) => {
    if (['CANCELADA', 'APROVADA'].includes(programacao.status)) {
      alert('Esta programação não pode ser cancelada');
      return;
    }

    // Se não há motivo, abrir modal
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
      alert('Programação cancelada com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      alert('Erro ao cancelar programação. Tente novamente.');
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
    handleAnalisar,
    handleAprovar,
    handleRejeitar,
    handleCancelar,

    // Controle do modal de workflow
    showWorkflowModal,
    workflowAction,
    selectedProgramacao,
    handleCloseWorkflowModal,
  };
}
