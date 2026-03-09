// src/features/anomalias/hooks/useAnomaliasActions.ts
import { useCallback } from 'react';
import { Anomalia } from '../types';

interface UseAnomaliasActionsProps {
  openModal: (mode: 'create' | 'edit' | 'view', entity?: Anomalia) => void;
  deleteItem: (id: string) => Promise<boolean>;
  gerarProgramacaoOS: (anomaliaId: string) => Promise<any>;
  cancelar: (anomaliaId: string, motivo?: string) => Promise<Anomalia>;
  onSuccess: () => void | Promise<void>;
}

export function useAnomaliasActions({
  openModal,
  deleteItem,
  gerarProgramacaoOS,
  cancelar,
  onSuccess,
}: UseAnomaliasActionsProps) {
  const handleView = useCallback(
    (anomalia: Anomalia) => {
      openModal('view', anomalia);
    },
    [openModal]
  );

  const handleEdit = useCallback(
    (anomalia: Anomalia) => {
      // Verificar se a anomalia pode ser editada
      if (anomalia.status !== 'AGUARDANDO' && anomalia.status !== 'EM_ANALISE') {
        alert(
          `Não é possível editar uma anomalia com status "${anomalia.status}". ` +
          'Apenas anomalias "AGUARDANDO" ou "EM ANÁLISE" podem ser editadas.'
        );
        return;
      }
      openModal('edit', anomalia);
    },
    [openModal]
  );

  const handleDelete = useCallback(
    async (anomalia: Anomalia) => {
      // Verificar se a anomalia pode ser deletada
      if (anomalia.status !== 'AGUARDANDO' && anomalia.status !== 'CANCELADA') {
        alert(
          `Não é possível excluir uma anomalia com status "${anomalia.status}". ` +
          'Apenas anomalias "AGUARDANDO" ou "CANCELADA" podem ser excluídas.'
        );
        return;
      }

      const confirmDelete = confirm(
        `Tem certeza que deseja excluir a anomalia: ${anomalia.descricao}?`
      );

      if (!confirmDelete) return;

      try {
        await deleteItem(anomalia.id);
        await onSuccess();
      } catch (error) {
        console.error('Erro ao excluir anomalia:', error);
        alert('Erro ao excluir anomalia. Tente novamente.');
      }
    },
    [deleteItem, onSuccess]
  );

  const handleGerarProgramacaoOS = useCallback(
    async (anomalia: Anomalia) => {
      // Verificar se pode programar OS
      if (
        anomalia.status !== 'AGUARDANDO' &&
        anomalia.status !== 'EM_ANALISE'
      ) {
        alert(
          'Só é possível programar OS para anomalias com status "AGUARDANDO" ou "EM ANÁLISE".'
        );
        return;
      }

      const confirmProgramarOS = confirm(
        `Programar Ordem de Serviço para a anomalia: ${anomalia.descricao}?`
      );

      if (!confirmProgramarOS) return;

      try {
        await gerarProgramacaoOS(anomalia.id);
        await onSuccess();
        alert('Programação de OS criada com sucesso!');
      } catch (error) {
        console.error('Erro ao programar OS:', error);
        alert('Erro ao programar OS. Tente novamente.');
      }
    },
    [gerarProgramacaoOS, onSuccess]
  );

  const handleCancelar = useCallback(
    async (anomalia: Anomalia) => {
      // Verificar se pode cancelar
      if (
        anomalia.status === 'RESOLVIDA' ||
        anomalia.status === 'CANCELADA'
      ) {
        alert('Esta anomalia já foi resolvida ou cancelada.');
        return;
      }

      const motivo = prompt('Digite o motivo do cancelamento:');

      if (!motivo) {
        alert('É necessário informar o motivo do cancelamento.');
        return;
      }

      try {
        await cancelar(anomalia.id, motivo);
        await onSuccess();
        alert('Anomalia cancelada com sucesso!');
      } catch (error) {
        console.error('Erro ao cancelar anomalia:', error);
        alert('Erro ao cancelar anomalia. Tente novamente.');
      }
    },
    [cancelar, onSuccess]
  );

  return {
    handleView,
    handleEdit,
    handleDelete,
    handleGerarProgramacaoOS,
    handleCancelar,
  };
}
