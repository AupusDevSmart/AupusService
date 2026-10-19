// src/features/equipamentos/components/modals/index.ts
export { EquipamentoUCModal } from './EquipamentoUCModal';
export { ComponenteUARModal } from './ComponenteUARModal';

import type { Equipamento } from '../../types';

// Tipos para os modais
export interface ModalUCState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  entity: Equipamento | null;
}

export interface ModalUARState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  entity: Equipamento | null;
  equipamentoPai: Equipamento | null;
}
