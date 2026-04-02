// src/features/anomalias/hooks/useAnomaliasActions.ts
import { useCallback } from 'react';
import { Anomalia } from '../types';

interface UseAnomaliasActionsProps {
  openModal: (mode: 'create' | 'edit' | 'view', entity?: Anomalia) => void;
  deleteItem: (id: string) => Promise<boolean>;
  onSuccess: () => void | Promise<void>;
}

export function useAnomaliasActions({
  openModal,
  deleteItem,
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
      if (anomalia.status !== 'REGISTRADA') {
        alert(
          `Nao e possivel editar uma anomalia com status "${anomalia.status}". ` +
          'Apenas anomalias "REGISTRADA" podem ser editadas.'
        );
        return;
      }
      openModal('edit', anomalia);
    },
    [openModal]
  );

  const handleDelete = useCallback(
    async (anomalia: Anomalia) => {
      if (anomalia.status !== 'REGISTRADA') {
        alert(
          `Nao e possivel excluir uma anomalia com status "${anomalia.status}". ` +
          'Apenas anomalias "REGISTRADA" podem ser excluidas.'
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

  return {
    handleView,
    handleEdit,
    handleDelete,
  };
}
