// src/hooks/useGenericModal.ts
import { useState, useCallback } from 'react';
import { BaseEntity, ModalState, ModalMode } from '@/types/base';

interface UseGenericModalReturn<T extends BaseEntity> {
  modalState: ModalState<T>;
  openModal: (mode: ModalMode, entity?: T | null) => void;
  closeModal: () => void;
  isViewMode: boolean;
  isEditMode: boolean;
  isCreateMode: boolean;
}

export function useGenericModal<T extends BaseEntity>(): UseGenericModalReturn<T> {
  const [modalState, setModalState] = useState<ModalState<T>>({
    isOpen: false,
    mode: 'create',
    entity: null
  });

  const openModal = useCallback((mode: ModalMode, entity: T | null = null) => {
    setModalState({
      isOpen: true,
      mode,
      entity
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      mode: 'create',
      entity: null
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