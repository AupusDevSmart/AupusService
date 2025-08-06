// src/features/equipamentos/hooks/useEquipamentos.ts
import { useState, useMemo } from 'react';

// ============================================================================
// TIPOS BASEADOS NA ESTRUTURA REAL DO PROJETO
// ============================================================================

// Tipos para Proprietário
export interface Proprietario {
  id: number;
  razaoSocial: string;
  cnpjCpf: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
}

// Tipos para Planta
export interface Planta {
  id: number;
  nome: string;
  cnpj: string;
  proprietarioId: number;
  criadoEm: string;
}

// Tipo para Equipamento Pai (resumido para relacionamentos)
export interface EquipamentoPai {
  id: number;
  nome: string;
  classificacao: 'UC';
  criticidade: string;
  criadoEm: string;
}

// Tipos para Equipamento (estrutura completa)
export interface Equipamento {
  id: number;
  criadoEm: string;
  nome: string;
  classificacao: 'UC' | 'UAR'; // UC = Equipamento, UAR = Componente
  plantaId: number;
  proprietarioId: number;
  proprietario: Proprietario;
  planta: Planta;
  fabricante?: string;
  modelo?: string;
  numeroSerie?: string;
  criticidade: string; // '1' a '5'
  dataImobilizacao?: string;
  dataInstalacao?: string;
  vidaUtil?: number;
  valorImobilizado?: number;
  valorContabil?: number;
  localizacao: string; // Campo de texto livre
  tipo: string;
  totalComponentes: number;
  // Para UAR (componentes)
  equipamentoPaiId?: number;
  equipamentoPai?: EquipamentoPai;
}

// ============================================================================
// DADOS SIMULADOS BASEADOS NA ESTRUTURA REAL
// ============================================================================

// Proprietários
const mockProprietarios: Proprietario[] = [
  {
    id: 1,
    razaoSocial: 'Empresa ABC Ltda',
    cnpjCpf: '12.345.678/0001-90',
    tipo: 'pessoa_juridica'
  },
  {
    id: 2,
    razaoSocial: 'João Silva',
    cnpjCpf: '123.456.789-00',
    tipo: 'pessoa_fisica'
  }
];

// Plantas
const mockPlantas: Planta[] = [
  {
    id: 1,
    nome: 'Planta Industrial São Paulo',
    cnpj: '12.345.678/0001-90',
    proprietarioId: 1,
    criadoEm: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    nome: 'Planta Subestação Central',
    cnpj: '12.345.678/0001-90',
    proprietarioId: 1,
    criadoEm: '2024-01-20T14:15:00Z'
  },
  {
    id: 3,
    nome: 'Estação de Bombeamento Sul',
    cnpj: '12.345.678/0001-90',
    proprietarioId: 1,
    criadoEm: '2024-02-01T09:00:00Z'
  },
  {
    id: 4,
    nome: 'Oficina João Silva',
    cnpj: '55.666.777/0001-88',
    proprietarioId: 2,
    criadoEm: '2024-02-10T16:45:00Z'
  }
];

// Equipamentos (UC e UAR)
const mockEquipamentos: Equipamento[] = [
  // ============================================================================
  // EQUIPAMENTOS UC (Equipamentos principais)
  // ============================================================================
  {
    id: 1,
    criadoEm: '2024-01-15T10:30:00Z',
    nome: 'Sistema de Controle Principal',
    classificacao: 'UC',
    plantaId: 1,
    proprietarioId: 1,
    proprietario: mockProprietarios[0],
    planta: mockPlantas[0],
    fabricante: 'Siemens',
    modelo: 'SIMATIC S7-1500',
    numeroSerie: 'SIE2024001',
    criticidade: '5',
    dataImobilizacao: '2024-01-15',
    vidaUtil: 10,
    valorImobilizado: 15000.00,
    valorContabil: 13500.00,
    localizacao: 'Sala de Controle - Painel Principal',
    tipo: 'Sistema de Controle',
    totalComponentes: 2
  },
  {
    id: 2,
    criadoEm: '2024-01-20T14:15:00Z',
    nome: 'Transformador Principal TR-01',
    classificacao: 'UC',
    plantaId: 2,
    proprietarioId: 1,
    proprietario: mockProprietarios[0],
    planta: mockPlantas[1],
    fabricante: 'WEG',
    modelo: 'TR-500-220',
    numeroSerie: 'WEG2024001',
    criticidade: '5',
    dataImobilizacao: '2024-01-20',
    vidaUtil: 25,
    valorImobilizado: 85000.00,
    valorContabil: 78000.00,
    localizacao: 'Pátio de Manobras - Setor A',
    tipo: 'Transformador',
    totalComponentes: 1
  },
  {
    id: 3,
    criadoEm: '2024-02-01T09:00:00Z',
    nome: 'Bomba Centrífuga BP-02',
    classificacao: 'UC',
    plantaId: 3,
    proprietarioId: 1,
    proprietario: mockProprietarios[0],
    planta: mockPlantas[2],
    fabricante: 'KSB',
    modelo: 'BC-1000',
    numeroSerie: 'KSB2024001',
    criticidade: '4',
    dataImobilizacao: '2024-02-01',
    vidaUtil: 15,
    valorImobilizado: 25000.00,
    valorContabil: 22500.00,
    localizacao: 'Casa de Bombas - Posição 02',
    tipo: 'Bomba Centrífuga',
    totalComponentes: 2
  },
  {
    id: 4,
    criadoEm: '2024-02-10T16:45:00Z',
    nome: 'Compressor de Ar Industrial',
    classificacao: 'UC',
    plantaId: 4,
    proprietarioId: 2,
    proprietario: mockProprietarios[1],
    planta: mockPlantas[3],
    fabricante: 'Atlas Copco',
    modelo: 'GA 22',
    numeroSerie: 'AC2024001',
    criticidade: '4',
    dataImobilizacao: '2024-02-10',
    vidaUtil: 12,
    valorImobilizado: 35000.00,
    valorContabil: 32000.00,
    localizacao: 'Área de Manutenção - Setor B',
    tipo: 'Compressor',
    totalComponentes: 3
  },
  {
    id: 5,
    criadoEm: '2024-02-15T11:30:00Z',
    nome: 'Sistema Hidráulico Principal',
    classificacao: 'UC',
    plantaId: 3,
    proprietarioId: 1,
    proprietario: mockProprietarios[0],
    planta: mockPlantas[2],
    fabricante: 'Bosch Rexroth',
    modelo: 'SH-2000',
    numeroSerie: 'BR2024001',
    criticidade: '3',
    dataImobilizacao: '2024-02-15',
    vidaUtil: 10,
    valorImobilizado: 18000.00,
    valorContabil: 16200.00,
    localizacao: 'Central Hidráulica',
    tipo: 'Sistema Hidráulico',
    totalComponentes: 1
  },

  // ============================================================================
  // COMPONENTES UAR (Componentes dos equipamentos)
  // ============================================================================
  {
    id: 10,
    criadoEm: '2024-01-15T11:00:00Z',
    nome: 'Sensor de Temperatura',
    classificacao: 'UAR',
    equipamentoPaiId: 1,
    plantaId: 1,
    proprietarioId: 1,
    proprietario: mockProprietarios[0],
    planta: mockPlantas[0],
    equipamentoPai: {
      id: 1,
      nome: 'Sistema de Controle Principal',
      classificacao: 'UC',
      criticidade: '5',
      criadoEm: '2024-01-15T10:30:00Z'
    },
    fabricante: 'Siemens',
    modelo: 'SITRANS T',
    numeroSerie: 'SIE-TEMP-001',
    criticidade: '4',
    tipo: 'Sensor de Temperatura',
    dataInstalacao: '2024-01-15',
    localizacao: 'Entrada do Motor - Lado Direito',
    totalComponentes: 0
  },
  {
    id: 11,
    criadoEm: '2024-01-15T11:15:00Z',
    nome: 'Sensor de Vibração',
    classificacao: 'UAR',
    equipamentoPaiId: 1,
    plantaId: 1,
    proprietarioId: 1,
    proprietario: mockProprietarios[0],
    planta: mockPlantas[0],
    equipamentoPai: {
      id: 1,
      nome: 'Sistema de Controle Principal',
      classificacao: 'UC',
      criticidade: '5',
      criadoEm: '2024-01-15T10:30:00Z'
    },
    fabricante: 'SKF',
    modelo: 'CMSS 2200',
    numeroSerie: 'SKF-VIB-001',
    criticidade: '3',
    tipo: 'Sensor de Vibração',
    dataInstalacao: '2024-01-15',
    localizacao: 'Mancal Principal - Lado de Acionamento',
    totalComponentes: 0
  },
  {
    id: 12,
    criadoEm: '2024-01-20T15:00:00Z',
    nome: 'Relé de Proteção REL-001',
    classificacao: 'UAR',
    equipamentoPaiId: 2,
    plantaId: 2,
    proprietarioId: 1,
    proprietario: mockProprietarios[0],
    planta: mockPlantas[1],
    equipamentoPai: {
      id: 2,
      nome: 'Transformador Principal TR-01',
      classificacao: 'UC',
      criticidade: '5',
      criadoEm: '2024-01-20T14:15:00Z'
    },
    fabricante: 'Siemens',
    modelo: 'REL-7SA522',
    numeroSerie: 'REL7SA001',
    criticidade: '5',
    tipo: 'Relé de Proteção',
    dataInstalacao: '2024-01-20',
    localizacao: 'Painel de Controle A',
    totalComponentes: 0
  },
  {
    id: 13,
    criadoEm: '2024-02-01T10:00:00Z',
    nome: 'Motor Elétrico',
    classificacao: 'UAR',
    equipamentoPaiId: 3,
    plantaId: 3,
    proprietarioId: 1,
    proprietario: mockProprietarios[0],
    planta: mockPlantas[2],
    equipamentoPai: {
      id: 3,
      nome: 'Bomba Centrífuga BP-02',
      classificacao: 'UC',
      criticidade: '4',
      criadoEm: '2024-02-01T09:00:00Z'
    },
    fabricante: 'WEG',
    modelo: 'W22-15HP',
    numeroSerie: 'WEG-MOT-001',
    criticidade: '4',
    tipo: 'Motor Elétrico',
    dataInstalacao: '2024-02-01',
    localizacao: 'Base da Bomba - Acoplamento Direto',
    totalComponentes: 0
  },
  {
    id: 14,
    criadoEm: '2024-02-01T10:30:00Z',
    nome: 'Sensor de Pressão',
    classificacao: 'UAR',
    equipamentoPaiId: 3,
    plantaId: 3,
    proprietarioId: 1,
    proprietario: mockProprietarios[0],
    planta: mockPlantas[2],
    equipamentoPai: {
      id: 3,
      nome: 'Bomba Centrífuga BP-02',
      classificacao: 'UC',
      criticidade: '4',
      criadoEm: '2024-02-01T09:00:00Z'
    },
    fabricante: 'Rosemount',
    modelo: 'RM-3051C',
    numeroSerie: 'RM-PRESS-001',
    criticidade: '3',
    tipo: 'Sensor de Pressão',
    dataInstalacao: '2024-02-01',
    localizacao: 'Linha de Recalque - Flange Principal',
    totalComponentes: 0
  },
  {
    id: 15,
    criadoEm: '2024-02-10T17:00:00Z',
    nome: 'Filtro de Ar',
    classificacao: 'UAR',
    equipamentoPaiId: 4,
    plantaId: 4,
    proprietarioId: 2,
    proprietario: mockProprietarios[1],
    planta: mockPlantas[3],
    equipamentoPai: {
      id: 4,
      nome: 'Compressor de Ar Industrial',
      classificacao: 'UC',
      criticidade: '4',
      criadoEm: '2024-02-10T16:45:00Z'
    },
    fabricante: 'Atlas Copco',
    modelo: 'AF-22',
    numeroSerie: 'AC-FILTER-001',
    criticidade: '3',
    tipo: 'Filtro de Ar',
    dataInstalacao: '2024-02-10',
    localizacao: 'Entrada de Ar - Lateral Esquerda',
    totalComponentes: 0
  },
  {
    id: 16,
    criadoEm: '2024-02-10T17:15:00Z',
    nome: 'Válvula de Segurança',
    classificacao: 'UAR',
    equipamentoPaiId: 4,
    plantaId: 4,
    proprietarioId: 2,
    proprietario: mockProprietarios[1],
    planta: mockPlantas[3],
    equipamentoPai: {
      id: 4,
      nome: 'Compressor de Ar Industrial',
      classificacao: 'UC',
      criticidade: '4',
      criadoEm: '2024-02-10T16:45:00Z'
    },
    fabricante: 'Atlas Copco',
    modelo: 'SV-22',
    numeroSerie: 'AC-VALVE-001',
    criticidade: '5',
    tipo: 'Válvula de Segurança',
    dataInstalacao: '2024-02-10',
    localizacao: 'Reservatório - Saída Principal',
    totalComponentes: 0
  },
  {
    id: 17,
    criadoEm: '2024-02-10T17:30:00Z',
    nome: 'Manômetro Digital',
    classificacao: 'UAR',
    equipamentoPaiId: 4,
    plantaId: 4,
    proprietarioId: 2,
    proprietario: mockProprietarios[1],
    planta: mockPlantas[3],
    equipamentoPai: {
      id: 4,
      nome: 'Compressor de Ar Industrial',
      classificacao: 'UC',
      criticidade: '4',
      criadoEm: '2024-02-10T16:45:00Z'
    },
    fabricante: 'WIKA',
    modelo: 'DG-10',
    numeroSerie: 'WIKA-DG-001',
    criticidade: '2',
    tipo: 'Manômetro',
    dataInstalacao: '2024-02-10',
    localizacao: 'Painel de Controle - Display Principal',
    totalComponentes: 0
  },
  {
    id: 18,
    criadoEm: '2024-02-15T12:00:00Z',
    nome: 'Válvula Hidráulica',
    classificacao: 'UAR',
    equipamentoPaiId: 5,
    plantaId: 3,
    proprietarioId: 1,
    proprietario: mockProprietarios[0],
    planta: mockPlantas[2],
    equipamentoPai: {
      id: 5,
      nome: 'Sistema Hidráulico Principal',
      classificacao: 'UC',
      criticidade: '3',
      criadoEm: '2024-02-15T11:30:00Z'
    },
    fabricante: 'Bosch Rexroth',
    modelo: 'VH-2000',
    numeroSerie: 'BR-VH-001',
    criticidade: '4',
    tipo: 'Válvula Hidráulica',
    dataInstalacao: '2024-02-15',
    localizacao: 'Circuito Principal - Entrada',
    totalComponentes: 0
  }
];

// ============================================================================
// HOOK USEEQUIPAMENTOS
// ============================================================================

interface UseEquipamentosReturn {
  proprietarios: Proprietario[];
  plantas: Planta[];
  equipamentos: Equipamento[];
  equipamentosUC: Equipamento[]; // Apenas equipamentos principais
  componentesUAR: Equipamento[]; // Apenas componentes
  getEquipamentosByPlanta: (plantaId: number) => Equipamento[];
  getEquipamentosUCByPlanta: (plantaId: number) => Equipamento[];
  getComponentesByEquipamento: (equipamentoId: number) => Equipamento[];
  getPlantaById: (plantaId: number) => Planta | undefined;
  getEquipamentoById: (equipamentoId: number) => Equipamento | undefined;
  getProprietarioById: (proprietarioId: number) => Proprietario | undefined;
  loading: boolean;
}

export function useEquipamentos(): UseEquipamentosReturn {
  const [loading] = useState(false);

  // Separar equipamentos UC e componentes UAR usando useMemo com dependências vazias
  const equipamentosUC = useMemo(() => 
    mockEquipamentos.filter(eq => eq.classificacao === 'UC'), 
    [] // Array vazio para evitar recálculo desnecessário
  );

  const componentesUAR = useMemo(() => 
    mockEquipamentos.filter(eq => eq.classificacao === 'UAR'), 
    [] // Array vazio para evitar recálculo desnecessário
  );

  // Função para buscar todos os equipamentos/componentes por planta
  const getEquipamentosByPlanta = useMemo(() => 
    (plantaId: number): Equipamento[] => {
      return mockEquipamentos.filter(equipamento => equipamento.plantaId === plantaId);
    }, []
  );

  // Função para buscar apenas equipamentos UC por planta
  const getEquipamentosUCByPlanta = useMemo(() => 
    (plantaId: number): Equipamento[] => {
      return equipamentosUC.filter(equipamento => equipamento.plantaId === plantaId);
    }, [equipamentosUC]
  );

  // Função para buscar componentes UAR por equipamento pai
  const getComponentesByEquipamento = useMemo(() => 
    (equipamentoId: number): Equipamento[] => {
      return componentesUAR.filter(componente => componente.equipamentoPaiId === equipamentoId);
    }, [componentesUAR]
  );

  // Função para buscar planta por ID
  const getPlantaById = useMemo(() => 
    (plantaId: number): Planta | undefined => {
      return mockPlantas.find(planta => planta.id === plantaId);
    }, []
  );

  // Função para buscar equipamento por ID
  const getEquipamentoById = useMemo(() => 
    (equipamentoId: number): Equipamento | undefined => {
      return mockEquipamentos.find(equipamento => equipamento.id === equipamentoId);
    }, []
  );

  // Função para buscar proprietário por ID
  const getProprietarioById = useMemo(() => 
    (proprietarioId: number): Proprietario | undefined => {
      return mockProprietarios.find(proprietario => proprietario.id === proprietarioId);
    }, []
  );

  return {
    proprietarios: mockProprietarios,
    plantas: mockPlantas,
    equipamentos: mockEquipamentos,
    equipamentosUC,
    componentesUAR,
    getEquipamentosByPlanta,
    getEquipamentosUCByPlanta,
    getComponentesByEquipamento,
    getPlantaById,
    getEquipamentoById,
    getProprietarioById,
    loading
  };
}