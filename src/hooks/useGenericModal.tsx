// src/hooks/useGenericModal.ts - VERSÃO RETROCOMPATÍVEL
import { useState, useCallback } from 'react';
import { BaseEntity, ModalMode } from '@/types/base';

// ✅ ATUALIZANDO: Interface do ModalState para incluir dados pré-selecionados (OPCIONAL)
interface ModalState<T extends BaseEntity> {
  isOpen: boolean;
  mode: ModalMode;
  entity: T | null;
  preselectedData?: any; // ✅ NOVA: Campo opcional para não quebrar páginas existentes
}

interface UseGenericModalReturn<T extends BaseEntity> {
  modalState: ModalState<T>;
  openModal: (mode: ModalMode, entity?: T | null, preselectedData?: any) => void; // ✅ ATUALIZANDO: Terceiro parâmetro opcional
  closeModal: () => void;
  isViewMode: boolean;
  isEditMode: boolean;
  isCreateMode: boolean;
}

export function useGenericModal<T extends BaseEntity>(): UseGenericModalReturn<T> {
  const [modalState, setModalState] = useState<ModalState<T>>({
    isOpen: false,
    mode: 'create',
    entity: null,
    preselectedData: undefined // ✅ NOVA: Campo opcional inicializado como undefined
  });

  // ✅ ATUALIZANDO: openModal agora aceita dados pré-selecionados opcionais
  const openModal = useCallback((mode: ModalMode, entity: T | null = null, preselectedData?: any) => {
    setModalState({
      isOpen: true,
      mode,
      entity,
      preselectedData
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      mode: 'create',
      entity: null,
      preselectedData: undefined
    });
  }, []);

  return {
    modalState,
    openModal,
    closeModal,
    isViewMode: modalState.mode === 'view',
    isEditMode: modalState.mode === 'edit',
    isCreateMode: modalState.mode === 'create'
  };
}