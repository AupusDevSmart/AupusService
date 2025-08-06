// src/features/planos-manutencao/data/mock-data.ts

import { PlanoManutencao, PlanoEquipamento } from '../types';

export const mockPlanosManutencao: PlanoManutencao[] = [
  {
    id: '1',
    criadoEm: '2024-12-15T10:00:00Z',
    nome: 'Motores Elétricos Trifásicos',
    descricao: 'Plano padrão para manutenção de motores elétricos trifásicos de 1 a 50 HP',
    categoria: 'MOTORES_ELETRICOS',
    versao: '2.1',
    ativo: true,
    publico: true,
    criadoPor: 'João Silva',
    atualizadoEm: '2025-01-10T14:30:00Z',
    totalEquipamentos: 8,
    totalTarefasGeradas: 32,
    tarefasTemplate: [
      {
        id: 'template-1-1',
        tagBase: 'LUB',
        descricao: 'Lubrificação dos rolamentos principais',
        categoria: 'LUBRIFICACAO',
        tipoManutencao: 'PREVENTIVA',
        frequencia: 'MENSAL',
        condicaoAtivo: 'PARADO',
        criticidade: '4',
        duracaoEstimada: 2,
        tempoEstimado: 120,
        responsavelSugerido: 'Técnico Mecânico',
        observacoesTemplate: 'Usar graxa específica conforme manual do fabricante',
        ordem: 1,
        ativa: true,
        subTarefas: [
          {
            descricao: 'Desligar e travar o motor',
            obrigatoria: true,
            tempoEstimado: 15,
            ordem: 1
          },
          {
            descricao: 'Remover tampões dos pontos de lubrificação',
            obrigatoria: true,
            tempoEstimado: 10,
            ordem: 2
          },
          {
            descricao: 'Aplicar graxa conforme especificação',
            obrigatoria: true,
            tempoEstimado: 60,
            ordem: 3
          }
        ],
        recursos: [
          {
            tipo: 'MATERIAL',
            descricao: 'Graxa Shell Alvania EP2',
            quantidade: 2,
            unidade: 'kg',
            obrigatorio: true
          },
          {
            tipo: 'FERRAMENTA',
            descricao: 'Pistola de graxa',
            quantidade: 1,
            unidade: 'un',
            obrigatorio: true
          }
        ]
      },
      {
        id: 'template-1-2',
        tagBase: 'INSP-ELE',
        descricao: 'Inspeção das conexões elétricas',
        categoria: 'ELETRICA',
        tipoManutencao: 'INSPECAO',
        frequencia: 'SEMANAL',
        condicaoAtivo: 'FUNCIONANDO',
        criticidade: '3',
        duracaoEstimada: 1,
        tempoEstimado: 60,
        responsavelSugerido: 'Eletricista',
        ordem: 2,
        ativa: true,
        subTarefas: [
          {
            descricao: 'Verificar aperto dos terminais',
            obrigatoria: true,
            tempoEstimado: 20,
            ordem: 1
          },
          {
            descricao: 'Inspecionar isolação dos cabos',
            obrigatoria: true,
            tempoEstimado: 20,
            ordem: 2
          }
        ],
        recursos: [
          {
            tipo: 'FERRAMENTA',
            descricao: 'Câmera termográfica',
            quantidade: 1,
            unidade: 'un',
            obrigatorio: false
          }
        ]
      },
      {
        id: 'template-1-3',
        tagBase: 'VIB',
        descricao: 'Análise de vibração',
        categoria: 'INSPECAO',
        tipoManutencao: 'PREDITIVA',
        frequencia: 'TRIMESTRAL',
        condicaoAtivo: 'FUNCIONANDO',
        criticidade: '4',
        duracaoEstimada: 1.5,
        tempoEstimado: 90,
        responsavelSugerido: 'Técnico Especialista',
        ordem: 3,
        ativa: true,
        subTarefas: [
          {
            descricao: 'Configurar equipamento de medição',
            obrigatoria: true,
            tempoEstimado: 20,
            ordem: 1
          },
          {
            descricao: 'Realizar medições nos pontos críticos',
            obrigatoria: true,
            tempoEstimado: 50,
            ordem: 2
          }
        ],
        recursos: [
          {
            tipo: 'FERRAMENTA',
            descricao: 'Analisador de vibração',
            quantidade: 1,
            unidade: 'un',
            obrigatorio: true
          }
        ]
      },
      {
        id: 'template-1-4',
        tagBase: 'TERMO',
        descricao: 'Análise termográfica',
        categoria: 'INSPECAO',
        tipoManutencao: 'PREDITIVA',
        frequencia: 'BIMESTRAL',
        condicaoAtivo: 'FUNCIONANDO',
        criticidade: '3',
        duracaoEstimada: 0.5,
        tempoEstimado: 30,
        responsavelSugerido: 'Técnico Especialista',
        ordem: 4,
        ativa: true,
        subTarefas: [
          {
            descricao: 'Capturar imagens termográficas',
            obrigatoria: true,
            tempoEstimado: 20,
            ordem: 1
          }
        ],
        recursos: [
          {
            tipo: 'FERRAMENTA',
            descricao: 'Câmera termográfica',
            quantidade: 1,
            unidade: 'un',
            obrigatorio: true
          }
        ]
      }
    ]
  },
  {
    id: '2',
    criadoEm: '2024-11-20T09:30:00Z',
    nome: 'Bombas Centrífugas Padrão',
    descricao: 'Manutenção preventiva para bombas centrífugas horizontais',
    categoria: 'BOMBAS_CENTRIFUGAS',
    versao: '1.5',
    ativo: true,
    publico: true,
    criadoPor: 'Maria Santos',
    totalEquipamentos: 5,
    totalTarefasGeradas: 25,
    tarefasTemplate: [
      {
        id: 'template-2-1',
        tagBase: 'LUB-ROL',
        descricao: 'Lubrificação dos rolamentos da bomba',
        categoria: 'LUBRIFICACAO',
        tipoManutencao: 'PREVENTIVA',
        frequencia: 'QUINZENAL',
        condicaoAtivo: 'PARADO',
        criticidade: '4',
        duracaoEstimada: 1.5,
        tempoEstimado: 90,
        ordem: 1,
        ativa: true,
        subTarefas: [],
        recursos: []
      },
      {
        id: 'template-2-2',
        tagBase: 'INSP-SEL',
        descricao: 'Inspeção do selo mecânico',
        categoria: 'INSPECAO',
        tipoManutencao: 'INSPECAO',
        frequencia: 'SEMANAL',
        condicaoAtivo: 'FUNCIONANDO',
        criticidade: '5',
        duracaoEstimada: 0.5,
        tempoEstimado: 30,
        ordem: 2,
        ativa: true,
        subTarefas: [],
        recursos: []
      },
      {
        id: 'template-2-3',
        tagBase: 'PRES',
        descricao: 'Verificação de pressão e vazão',
        categoria: 'INSPECAO',
        tipoManutencao: 'PREVENTIVA',
        frequencia: 'DIARIA',
        condicaoAtivo: 'FUNCIONANDO',
        criticidade: '3',
        duracaoEstimada: 0.25,
        tempoEstimado: 15,
        ordem: 3,
        ativa: true,
        subTarefas: [],
        recursos: []
      },
      {
        id: 'template-2-4',
        tagBase: 'ALIN',
        descricao: 'Verificação do alinhamento',
        categoria: 'MECANICA',
        tipoManutencao: 'PREVENTIVA',
        frequencia: 'SEMESTRAL',
        condicaoAtivo: 'PARADO',
        criticidade: '4',
        duracaoEstimada: 4,
        tempoEstimado: 240,
        ordem: 4,
        ativa: true,
        subTarefas: [],
        recursos: []
      },
      {
        id: 'template-2-5',
        tagBase: 'CURVA',
        descricao: 'Levantamento da curva característica',
        categoria: 'INSPECAO',
        tipoManutencao: 'PREDITIVA',
        frequencia: 'ANUAL',
        condicaoAtivo: 'FUNCIONANDO',
        criticidade: '3',
        duracaoEstimada: 2,
        tempoEstimado: 120,
        ordem: 5,
        ativa: true,
        subTarefas: [],
        recursos: []
      }
    ]
  },
  {
    id: '3',
    criadoEm: '2024-10-05T14:15:00Z',
    nome: 'Transformadores de Potência',
    descricao: 'Manutenção para transformadores de média e alta tensão',
    categoria: 'TRANSFORMADORES',
    versao: '3.0',
    ativo: true,
    publico: false,
    criadoPor: 'Pedro Costa',
    atualizadoEm: '2024-12-20T10:45:00Z',
    totalEquipamentos: 3,
    totalTarefasGeradas: 18,
    tarefasTemplate: [
      {
        id: 'template-3-1',
        tagBase: 'OLEO',
        descricao: 'Análise do óleo isolante',
        categoria: 'INSPECAO',
        tipoManutencao: 'PREDITIVA',
        frequencia: 'ANUAL',
        condicaoAtivo: 'FUNCIONANDO',
        criticidade: '5',
        duracaoEstimada: 2,
        tempoEstimado: 120,
        ordem: 1,
        ativa: true,
        subTarefas: [],
        recursos: []
      },
      {
        id: 'template-3-2',
        tagBase: 'TEMP',
        descricao: 'Monitoramento de temperatura',
        categoria: 'INSPECAO',
        tipoManutencao: 'INSPECAO',
        frequencia: 'SEMANAL',
        condicaoAtivo: 'FUNCIONANDO',
        criticidade: '4',
        duracaoEstimada: 0.5,
        tempoEstimado: 30,
        ordem: 2,
        ativa: true,
        subTarefas: [],
        recursos: []
      },
      {
        id: 'template-3-3',
        tagBase: 'INSP-VIS',
        descricao: 'Inspeção visual externa',
        categoria: 'INSPECAO',
        tipoManutencao: 'INSPECAO',
        frequencia: 'MENSAL',
        condicaoAtivo: 'FUNCIONANDO',
        criticidade: '3',
        duracaoEstimada: 1,
        tempoEstimado: 60,
        ordem: 3,
        ativa: true,
        subTarefas: [],
        recursos: []
      },
      {
        id: 'template-3-4',
        tagBase: 'RESIS',
        descricao: 'Medição de resistência de isolamento',
        categoria: 'ELETRICA',
        tipoManutencao: 'PREVENTIVA',
        frequencia: 'SEMESTRAL',
        condicaoAtivo: 'PARADO',
        criticidade: '5',
        duracaoEstimada: 3,
        tempoEstimado: 180,
        ordem: 4,
        ativa: true,
        subTarefas: [],
        recursos: []
      },
      {
        id: 'template-3-5',
        tagBase: 'RELE',
        descricao: 'Teste de relés de proteção',
        categoria: 'ELETRICA',
        tipoManutencao: 'PREVENTIVA',
        frequencia: 'ANUAL',
        condicaoAtivo: 'PARADO',
        criticidade: '5',
        duracaoEstimada: 4,
        tempoEstimado: 240,
        ordem: 5,
        ativa: true,
        subTarefas: [],
        recursos: []
      },
      {
        id: 'template-3-6',
        tagBase: 'COMUT',
        descricao: 'Teste do comutador sob carga',
        categoria: 'ELETRICA',
        tipoManutencao: 'PREVENTIVA',
        frequencia: 'ANUAL',
        condicaoAtivo: 'PARADO',
        criticidade: '4',
        duracaoEstimada: 6,
        tempoEstimado: 360,
        ordem: 6,
        ativa: true,
        subTarefas: [],
        recursos: []
      }
    ]
  },
  {
    id: '4',
    criadoEm: '2025-01-02T08:00:00Z',
    nome: 'Compressores de Ar Industrial',
    descricao: 'Manutenção preventiva para compressores de parafuso e pistão',
    categoria: 'COMPRESSORES',
    versao: '1.0',
    ativo: false,
    publico: true,
    criadoPor: 'Ana Costa',
    totalEquipamentos: 0,
    totalTarefasGeradas: 0,
    tarefasTemplate: [
      {
        id: 'template-4-1',
        tagBase: 'FILTRO',
        descricao: 'Substituição dos filtros de ar',
        categoria: 'MECANICA',
        tipoManutencao: 'PREVENTIVA',
        frequencia: 'PERSONALIZADA',
        frequenciaPersonalizada: 45,
        condicaoAtivo: 'PARADO',
        criticidade: '3',
        duracaoEstimada: 0.5,
        tempoEstimado: 30,
        ordem: 1,
        ativa: true,
        subTarefas: [],
        recursos: []
      },
      {
        id: 'template-4-2',
        tagBase: 'OLEO-COMP',
        descricao: 'Troca do óleo lubrificante',
        categoria: 'LUBRIFICACAO',
        tipoManutencao: 'PREVENTIVA',
        frequencia: 'PERSONALIZADA',
        frequenciaPersonalizada: 180,
        condicaoAtivo: 'PARADO',
        criticidade: '4',
        duracaoEstimada: 2,
        tempoEstimado: 120,
        ordem: 2,
        ativa: true,
        subTarefas: [],
        recursos: []
      },
      {
        id: 'template-4-3',
        tagBase: 'PRES-COMP',
        descricao: 'Teste de pressão e vazão',
        categoria: 'INSPECAO',
        tipoManutencao: 'INSPECAO',
        frequencia: 'SEMANAL',
        condicaoAtivo: 'FUNCIONANDO',
        criticidade: '3',
        duracaoEstimada: 0.5,
        tempoEstimado: 30,
        ordem: 3,
        ativa: true,
        subTarefas: [],
        recursos: []
      }
    ]
  }
];

export const mockPlanosEquipamentos: PlanoEquipamento[] = [
  // Plano 1 (Motores) associado a 8 equipamentos
  {
    id: '1',
    criadoEm: '2025-01-10T09:00:00Z',
    planoManutencaoId: '1',
    equipamentoId: 1,
    plantaId: 1,
    ativo: true,
    dataAssociacao: '2025-01-10T09:00:00Z',
    associadoPor: 'João Silva'
  },
  {
    id: '2',
    criadoEm: '2025-01-10T09:00:00Z',
    planoManutencaoId: '1',
    equipamentoId: 11,
    plantaId: 1,
    ativo: true,
    dataAssociacao: '2025-01-10T09:00:00Z',
    associadoPor: 'João Silva'
  },
  {
    id: '3',
    criadoEm: '2025-01-10T09:00:00Z',
    planoManutencaoId: '1',
    equipamentoId: 15,
    plantaId: 4,
    ativo: true,
    dataAssociacao: '2025-01-10T09:00:00Z',
    associadoPor: 'João Silva'
  },
  {
    id: '4',
    criadoEm: '2025-01-12T10:30:00Z',
    planoManutencaoId: '1',
    equipamentoId: 17,
    plantaId: 1,
    responsavelCustomizado: 'Carlos Técnico Especialista',
    ativo: true,
    dataAssociacao: '2025-01-12T10:30:00Z',
    associadoPor: 'Maria Santos'
  },
  
  // Plano 2 (Bombas) associado a 5 equipamentos
  {
    id: '5',
    criadoEm: '2025-01-08T14:00:00Z',
    planoManutencaoId: '2',
    equipamentoId: 3,
    plantaId: 1,
    ativo: true,
    dataAssociacao: '2025-01-08T14:00:00Z',
    associadoPor: 'Maria Santos'
  },
  {
    id: '6',
    criadoEm: '2025-01-08T14:00:00Z',
    planoManutencaoId: '2',
    equipamentoId: 16,
    plantaId: 4,
    ativo: true,
    dataAssociacao: '2025-01-08T14:00:00Z',
    associadoPor: 'Maria Santos'
  },
  
  // Plano 3 (Transformadores) associado a 3 equipamentos
  {
    id: '7',
    criadoEm: '2024-12-20T11:00:00Z',
    planoManutencaoId: '3',
    equipamentoId: 2,
    plantaId: 2,
    ativo: true,
    dataAssociacao: '2024-12-20T11:00:00Z',
    associadoPor: 'Pedro Costa'
  },
  {
    id: '8',
    criadoEm: '2024-12-20T11:00:00Z',
    planoManutencaoId: '3',
    equipamentoId: 12,
    plantaId: 2,
    ativo: true,
    dataAssociacao: '2024-12-20T11:00:00Z',
    associadoPor: 'Pedro Costa'
  }
];