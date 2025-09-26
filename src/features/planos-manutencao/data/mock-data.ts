// src/features/planos-manutencao/data/mock-data.ts
// ARQUIVO TEMPORÁRIO - REMOVER APÓS MIGRAÇÃO COMPLETA PARA API

export interface MockPlanoManutencao {
  id: number;
  nome: string;
  versao: string;
  categoria: string;
  ativo: boolean;
  publico: boolean;
  tarefasTemplate: MockTarefaTemplate[];
}

export interface MockTarefaTemplate {
  id: number;
  nome: string;
  ativa: boolean;
  ordem: number;
}

// Dados mínimos apenas para evitar erro 404
export const mockPlanosManutencao: MockPlanoManutencao[] = [
  {
    id: 1,
    nome: "Plano Exemplo - MIGRAR PARA API",
    versao: "1.0",
    categoria: "GERAL",
    ativo: true,
    publico: false,
    tarefasTemplate: [
      {
        id: 1,
        nome: "Tarefa Exemplo",
        ativa: true,
        ordem: 1
      }
    ]
  }
];

// Labels de categoria (manter compatibilidade temporária)
export const CATEGORIAS_PLANO_LABELS = {
  MOTORES_ELETRICOS: 'Motores Elétricos',
  BOMBAS_CENTRIFUGAS: 'Bombas Centrífugas',
  COMPRESSORES: 'Compressores',
  TRANSFORMADORES: 'Transformadores',
  GERADORES: 'Geradores',
  GERAL: 'Geral'
};

console.warn('🚨 AVISO: Usando dados mockados temporários. Migrar para API o mais rápido possível!');