// src/features/equipamentos/types/index.ts - ESTRUTURA SIMPLIFICADA
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

// ============================================================================
// NOVA ESTRUTURA: Proprietário → Planta → Equipamento → Componente
// ============================================================================

// Tipos base reutilizados
export interface ProprietarioBasico {
  id: number;
  razaoSocial: string;
  cnpjCpf: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
}

export interface Planta extends BaseEntity {
  nome: string;
  cnpj: string;
  proprietarioId: number;
  proprietario?: ProprietarioBasico;
}

// ============================================================================
// EQUIPAMENTO - LÓGICA UC/UAR MANTIDA
// ============================================================================
export interface Equipamento extends BaseEntity {
  // Informações básicas
  nome: string;
  classificacao: 'UC' | 'UAR'; // ← OBRIGATÓRIO: UC = Equipamento, UAR = Componente
  
  // ✅ NOVA LÓGICA SIMPLIFICADA:
  // - UC: Pertence diretamente a uma planta
  // - UAR: Pertence a um UC (equipamentoPaiId)
  plantaId?: number; // Obrigatório para UC
  proprietarioId?: number; // Herdado da planta
  equipamentoPaiId?: number; // Obrigatório para UAR
  equipamentoPai?: Equipamento; // Referência ao UC pai (apenas para UAR)
  
  // Relacionamentos para exibição
  proprietario?: ProprietarioBasico;
  planta?: Planta;
  
  // Dados técnicos
  fabricante?: string;
  modelo?: string;
  numeroSerie?: string;
  criticidade: '1' | '2' | '3' | '4' | '5'; // 1-5 conforme necessidade
  tipo?: string; // Tipo do equipamento/componente
  
  // Estados e configurações
  emOperacao?: 'sim' | 'nao';
  tipoDepreciacao?: 'linear' | 'uso';
  
  // Datas
  dataImobilizacao?: string;
  dataInstalacao?: string; // Para componentes
  
  // Valores financeiros
  valorImobilizado?: number;
  valorDepreciacao?: number;
  valorContabil?: number;
  vidaUtil?: number; // em anos
  
  // Fornecedor e centro de custo
  fornecedor?: string;
  centroCusto?: string;
  
  // Manutenção
  planoManutencao?: string;
  
  // Dados técnicos dinâmicos
  dadosTecnicos?: string;
  
  // ✅ LOCALIZAÇÃO: Campo de texto livre para indicar a área
  localizacao?: string; // Ex: "Produção", "Logística", "Administrativo"
  
  // Componentes UAR (apenas para UC)
  componentesUAR?: Equipamento[]; // Lista de UARs que pertencem a este UC
  totalComponentes?: number; // Contagem de UARs
}

// ============================================================================
// FORMULÁRIOS E FILTROS
// ============================================================================
export interface EquipamentoFormData {
  // Básicos
  nome: string;
  classificacao: 'UC' | 'UAR'; // UC = Equipamento, UAR = Componente
  proprietarioId?: number;
  plantaId?: number; // Obrigatório para UC
  equipamentoPaiId?: number; // Obrigatório para UAR
  
  // Dados gerais
  fabricante?: string;
  modelo?: string;
  numeroSerie?: string;
  criticidade: '1' | '2' | '3' | '4' | '5';
  tipo?: string;
  
  // Estados
  emOperacao?: 'sim' | 'nao';
  tipoDepreciacao?: 'linear' | 'uso';
  
  // Datas
  dataImobilizacao?: string;
  dataInstalacao?: string;
  
  // Valores financeiros
  valorImobilizado?: number;
  valorDepreciacao?: number;
  valorContabil?: number;
  vidaUtil?: number;
  
  // Fornecedor e centro de custo
  fornecedor?: string;
  centroCusto?: string;
  
  // Manutenção
  planoManutencao?: string;
  dadosTecnicos?: string;
  
  // Localização (área)
  localizacao?: string;
}

export interface EquipamentosFilters extends BaseFiltersType {
  proprietarioId: string;
  plantaId: string;
  criticidade: string;
  equipamentoPaiId?: string; // Para filtrar por equipamento pai
}

export interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  equipamento: Equipamento | null;
}

export interface ComponenteModalState {
  isOpen: boolean;
  mode: ModalMode;
  equipamentoPai: Equipamento | null; // Equipamento que terá componentes
  componentes: Equipamento[]; // Lista de componentes
  editingComponente: Equipamento | null;
}

// ============================================================================
// UTILITÁRIOS PARA VALIDAÇÃO
// ============================================================================
export const validateEquipamentoData = (data: EquipamentoFormData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.nome?.trim()) {
    errors.push('Nome do equipamento é obrigatório');
  }
  
  if (!data.criticidade) {
    errors.push('Criticidade é obrigatória');
  }
  
  // Validações específicas
  if (!data.equipamentoPaiId && !data.plantaId) {
    errors.push('Equipamento deve pertencer a uma planta ou ser componente de outro equipamento');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================================================
// UTILITÁRIOS PARA CONSULTAS
// ============================================================================
export const isUC = (equipamento: Equipamento): boolean => {
  return equipamento.classificacao === 'UC';
};

export const isUAR = (equipamento: Equipamento): boolean => {
  return equipamento.classificacao === 'UAR';
};

export const getUARsByUC = (equipamentos: Equipamento[], ucId: number): Equipamento[] => {
  return equipamentos.filter(eq => eq.classificacao === 'UAR' && eq.equipamentoPaiId === ucId);
};

export const getUCsByPlanta = (equipamentos: Equipamento[], plantaId: number): Equipamento[] => {
  return equipamentos.filter(eq => eq.classificacao === 'UC' && eq.plantaId === plantaId);
};

export const getEquipamentoWithComponentes = (equipamento: Equipamento, allEquipamentos: Equipamento[]): Equipamento => {
  if (equipamento.classificacao === 'UC') {
    const componentesUAR = getUARsByUC(allEquipamentos, equipamento.id);
    return {
      ...equipamento,
      componentesUAR,
      totalComponentes: componentesUAR.length
    };
  }
  return equipamento;
};

// Re-exportar tipos base
export { type ModalMode };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};