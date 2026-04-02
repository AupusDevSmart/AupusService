// src/features/execucao-os/hooks/useExecucaoOSActions.ts
import { useCallback, useState } from 'react';
import type { ExecucaoOS } from '../types';

interface UseExecucaoOSActionsProps {
  openModal: (mode: 'view' | 'edit' | 'create' | 'finalizar' | 'anexos', entity?: ExecucaoOS) => void;
  onSuccess: () => Promise<void>;
  onIniciar?: (item: ExecucaoOS) => Promise<void>;
  onPausar?: (item: ExecucaoOS) => Promise<void>;
  onRetomar?: (item: ExecucaoOS) => Promise<void>;
  onExecutar?: (item: ExecucaoOS) => Promise<void>;
  onAuditar?: (item: ExecucaoOS) => Promise<void>;
  onReabrir?: (item: ExecucaoOS) => Promise<void>;
  onFinalizar?: (item: ExecucaoOS) => Promise<void>;
  onCancelar?: (item: ExecucaoOS) => Promise<void>;
}

/**
 * Hook customizado para gerenciar ações da tabela de Execução de OS
 * Segue o padrão definido no FEATURE_REFACTORING_GUIDE.md
 */
export function useExecucaoOSActions({
  openModal,
  onSuccess,
  onIniciar,
  onPausar,
  onRetomar,
  onExecutar,
  onAuditar,
  onReabrir,
  onFinalizar,
  onCancelar,
}: UseExecucaoOSActionsProps) {
  const [loading, setLoading] = useState(false);

  /**
   * Handler para visualizar execução
   */
  const handleView = useCallback((execucao: ExecucaoOS) => {
    console.log('Visualizar execução:', execucao.id);
    openModal('view', execucao);
  }, [openModal]);

  /**
   * Handler para editar execução
   * Apenas execuções não finalizadas ou canceladas podem ser editadas
   */
  const handleEdit = useCallback((execucao: ExecucaoOS) => {
    console.log('Editar execução:', execucao.id);

    const status = execucao.statusExecucao || execucao.status;

    if (status === 'FINALIZADA' || status === 'CANCELADA') {
      alert('Execuções finalizadas ou canceladas não podem ser editadas. Use o modo visualizar.');
      openModal('view', execucao);
      return;
    }

    openModal('edit', execucao);
  }, [openModal]);

  /**
   * Handler para iniciar ou retomar execução
   */
  const handleIniciar = useCallback(async (execucao: ExecucaoOS) => {
    if (!onIniciar) return;

    try {
      setLoading(true);
      await onIniciar(execucao);
      await onSuccess();
    } catch (error) {
      console.error('Erro ao iniciar/retomar execução:', error);
      alert('Erro ao iniciar/retomar execução. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [onIniciar, onSuccess]);

  /**
   * Handler para pausar execução
   */
  const handlePausar = useCallback(async (execucao: ExecucaoOS) => {
    if (!onPausar) return;

    try {
      setLoading(true);
      await onPausar(execucao);
      await onSuccess();
    } catch (error) {
      console.error('Erro ao pausar execução:', error);
      alert('Erro ao pausar execução. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [onPausar, onSuccess]);

  /**
   * Handler para retomar execução pausada
   */
  const handleRetomar = useCallback(async (execucao: ExecucaoOS) => {
    if (!onRetomar) return;

    try {
      setLoading(true);
      await onRetomar(execucao);
      await onSuccess();
    } catch (error) {
      console.error('Erro ao retomar execução:', error);
      alert('Erro ao retomar execução. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [onRetomar, onSuccess]);

  /**
   * Handler para finalizar execução
   */
  const handleFinalizar = useCallback(async (execucao: ExecucaoOS) => {
    if (!onFinalizar) return;

    try {
      setLoading(true);
      await onFinalizar(execucao);
      // onSuccess será chamado pelo componente após confirmação do modal
    } catch (error) {
      console.error('Erro ao finalizar execução:', error);
      alert('Erro ao finalizar execução. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [onFinalizar]);

  /**
   * Handler para cancelar execução
   */
  const handleCancelar = useCallback(async (execucao: ExecucaoOS) => {
    if (!onCancelar) return;

    try {
      setLoading(true);
      await onCancelar(execucao);
      await onSuccess();
    } catch (error) {
      console.error('Erro ao cancelar execução:', error);
      alert('Erro ao cancelar execução. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [onCancelar, onSuccess]);

  /**
   * Handler para registrar execução (EM_EXECUCAO/PAUSADA -> EXECUTADA)
   */
  const handleExecutar = useCallback(async (execucao: ExecucaoOS) => {
    if (!onExecutar) return;

    try {
      setLoading(true);
      await onExecutar(execucao);
    } catch (error) {
      console.error('Erro ao registrar execução:', error);
      alert('Erro ao registrar execução. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [onExecutar]);

  /**
   * Handler para auditar execução (EXECUTADA -> AUDITADA)
   */
  const handleAuditar = useCallback(async (execucao: ExecucaoOS) => {
    if (!onAuditar) return;

    try {
      setLoading(true);
      await onAuditar(execucao);
    } catch (error) {
      console.error('Erro ao auditar execução:', error);
      alert('Erro ao auditar execução. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [onAuditar]);

  /**
   * Handler para reabrir execução (AUDITADA -> EM_EXECUCAO)
   */
  const handleReabrir = useCallback(async (execucao: ExecucaoOS) => {
    if (!onReabrir) return;

    try {
      setLoading(true);
      await onReabrir(execucao);
    } catch (error) {
      console.error('Erro ao reabrir execução:', error);
      alert('Erro ao reabrir execução. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [onReabrir]);

  /**
   * Handler para gerenciar anexos
   */
  const handleAnexos = useCallback((execucao: ExecucaoOS) => {
    console.log('Gerenciar anexos da execução:', execucao.id);
    openModal('anexos', execucao);
  }, [openModal]);

  /**
   * Handler para gerar relatório
   */
  const handleRelatorio = useCallback((execucao: ExecucaoOS) => {
    console.log('Gerar relatório da execução:', execucao.id);
    alert('Funcionalidade de relatório será implementada em breve');
  }, []);

  return {
    loading,
    handleView,
    handleEdit,
    handleIniciar,
    handlePausar,
    handleRetomar,
    handleExecutar,
    handleAuditar,
    handleReabrir,
    handleFinalizar,
    handleCancelar,
    handleAnexos,
    handleRelatorio,
  };
}
