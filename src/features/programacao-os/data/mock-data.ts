// src/features/programacao-os/data/mock-data.ts
import { OrdemServico } from '../types';

export const mockOrdensServico: OrdemServico[] = [
  {
    id: '1',
    criadoEm: '2025-01-20T08:00:00Z',
    numeroOS: 'OS-2025-001',
    descricao: 'Manutenção preventiva do sistema de controle principal',
    local: 'Planta Industrial São Paulo',
    ativo: 'Sistema de Controle Principal',
    condicoes: 'PARADO',
    status: 'PROGRAMADA',
    tipo: 'PREVENTIVA',
    prioridade: 'ALTA',
    origem: 'TAREFA',
    plantaId: 1,
    equipamentoId: 1,
    tarefaId: '1',
    tempoEstimado: 4,
    duracaoEstimada: 6,
    dataProgramada: '2025-02-15T08:00:00Z',
    horaProgramada: '08:00',
    responsavel: 'João Silva',
    viatura: 'VTR-001',
    time: 'Equipe Elétrica',
    orcamentoPrevisto: 2500.00,
    observacoes: 'Verificar todos os componentes conforme checklist',
    observacoesProgramacao: 'Coordenar com operação para parada do equipamento',
    criadoPor: 'Sistema Automático',
    programadoPor: 'Maria Santos',
    atualizadoEm: '2025-01-22T14:30:00Z',
    materiais: [
      {
        id: '1-m1',
        descricao: 'Óleo isolante Shell Diala S3 ZX-I',
        quantidade: 20,
        unidade: 'L',
        confirmado: true,
        disponivel: true,
        custo: 45.00
      },
      {
        id: '1-m2',
        descricao: 'Filtros de ar condicionado',
        quantidade: 4,
        unidade: 'un',
        confirmado: true,
        disponivel: true,
        custo: 120.00
      }
    ],
    ferramentas: [
      {
        id: '1-f1',
        descricao: 'Multímetro digital Fluke 87V',
        quantidade: 2,
        confirmada: true,
        disponivel: true
      },
      {
        id: '1-f2',
        descricao: 'Chaves de fenda e philips conjunto',
        quantidade: 1,
        confirmada: true,
        disponivel: true
      }
    ],
    tecnicos: [
      {
        id: '1-t1',
        nome: 'Carlos Técnico',
        especialidade: 'Eletricista Industrial',
        horasEstimadas: 4,
        custoHora: 85.00,
        disponivel: true
      },
      {
        id: '1-t2',
        nome: 'Pedro Auxiliar',
        especialidade: 'Auxiliar Técnico',
        horasEstimadas: 4,
        custoHora: 45.00,
        disponivel: true
      }
    ],
    historico: [
      {
        id: '1-h1',
        acao: 'OS criada automaticamente da tarefa MNT-001',
        usuario: 'Sistema Automático',
        data: '2025-01-20T08:00:00Z'
      },
      {
        id: '1-h2',
        acao: 'OS programada para execução',
        usuario: 'Maria Santos',
        data: '2025-01-22T14:30:00Z',
        observacoes: 'Recursos confirmados e equipe alocada'
      }
    ]
  },
  {
    id: '2',
    criadoEm: '2025-01-18T14:25:00Z',
    numeroOS: 'OS-2025-002',
    descricao: 'Correção de vazamento identificado na inspeção',
    local: 'Estação de Bombeamento Sul',
    ativo: 'Válvula Hidráulica Principal',
    condicoes: 'PARADO',
    status: 'PLANEJADA',
    tipo: 'CORRETIVA',
    prioridade: 'CRITICA',
    origem: 'ANOMALIA',
    plantaId: 3,
    equipamentoId: 18,
    anomaliaId: '10',
    tempoEstimado: 3,
    duracaoEstimada: 4,
    orcamentoPrevisto: 1800.00,
    observacoes: 'Vazamento detectado durante vistoria de rotina',
    criadoPor: 'Carlos Silva',
    atualizadoEm: '2025-01-19T09:15:00Z',
    materiais: [
      {
        id: '2-m1',
        descricao: 'Kit de vedação para válvula hidráulica',
        quantidade: 1,
        unidade: 'kit',
        confirmado: false,
        disponivel: false,
        custo: 350.00
      },
      {
        id: '2-m2',
        descricao: 'Fluido hidráulico ISO VG 46',
        quantidade: 10,
        unidade: 'L',
        confirmado: true,
        disponivel: true,
        custo: 25.00
      }
    ],
    ferramentas: [
      {
        id: '2-f1',
        descricao: 'Chaves para válvulas hidráulicas',
        quantidade: 1,
        confirmada: true,
        disponivel: true
      },
      {
        id: '2-f2',
        descricao: 'Equipamento de soldagem portátil',
        quantidade: 1,
        confirmada: false,
        disponivel: true
      }
    ],
    tecnicos: [
      {
        id: '2-t1',
        nome: 'Roberto Soldador',
        especialidade: 'Soldador Certificado',
        horasEstimadas: 3,
        custoHora: 120.00,
        disponivel: true
      }
    ],
    historico: [
      {
        id: '2-h1',
        acao: 'OS criada da anomalia sobre vazamento',
        usuario: 'Carlos Silva',
        data: '2025-01-18T14:25:00Z'
      },
      {
        id: '2-h2',
        acao: 'Status alterado para Planejada',
        usuario: 'Ana Lima',
        data: '2025-01-19T09:15:00Z',
        observacoes: 'Aguardando disponibilidade do kit de vedação'
      }
    ]
  },
  {
    id: '3',
    criadoEm: '2025-01-15T10:30:00Z',
    numeroOS: 'OS-2025-003',
    descricao: 'Inspeção termográfica dos painéis elétricos',
    local: 'Planta Subestação Central',
    ativo: 'Painel Elétrico Principal',
    condicoes: 'FUNCIONANDO',
    status: 'EM_EXECUCAO',
    tipo: 'PREDITIVA',
    prioridade: 'MEDIA',
    origem: 'TAREFA',
    plantaId: 2,
    equipamentoId: 2,
    tarefaId: '2',
    tempoEstimado: 2,
    duracaoEstimada: 3,
    dataProgramada: '2025-01-25T08:00:00Z',
    horaProgramada: '08:00',
    dataInicioExecucao: '2025-01-25T08:15:00Z',
    responsavel: 'José Eletricista',
    viatura: 'VTR-003',
    time: 'Equipe Preditiva',
    orcamentoPrevisto: 800.00,
    observacoes: 'Inspeção conforme programa de manutenção preditiva',
    criadoPor: 'Sistema Automático',
    programadoPor: 'Pedro Costa',
    atualizadoEm: '2025-01-25T08:15:00Z',
    materiais: [],
    ferramentas: [
      {
        id: '3-f1',
        descricao: 'Câmera termográfica FLIR E8',
        quantidade: 1,
        confirmada: true,
        disponivel: true
      },
      {
        id: '3-f2',
        descricao: 'Laptop para análise',
        quantidade: 1,
        confirmada: true,
        disponivel: true
      }
    ],
    tecnicos: [
      {
        id: '3-t1',
        nome: 'José Eletricista',
        especialidade: 'Técnico em Termografia',
        horasEstimadas: 2,
        custoHora: 95.00,
        disponivel: true
      }
    ],
    historico: [
      {
        id: '3-h1',
        acao: 'OS criada da tarefa INSP-002',
        usuario: 'Sistema Automático',
        data: '2025-01-15T10:30:00Z'
      },
      {
        id: '3-h2',
        acao: 'OS programada',
        usuario: 'Pedro Costa',
        data: '2025-01-20T16:00:00Z'
      },
      {
        id: '3-h3',
        acao: 'Execução iniciada',
        usuario: 'José Eletricista',
        data: '2025-01-25T08:15:00Z'
      }
    ]
  },
  {
    id: '4',
    criadoEm: '2025-01-12T16:45:00Z',
    numeroOS: 'OS-2025-004',
    descricao: 'Calibração do sensor de pressão do transformador',
    local: 'Planta Subestação Central',
    ativo: 'Sensor de Pressão ST-001',
    condicoes: 'PARADO',
    status: 'FINALIZADA',
    tipo: 'PREVENTIVA',
    prioridade: 'ALTA',
    origem: 'TAREFA',
    plantaId: 2,
    equipamentoId: 12,
    tarefaId: '3',
    tempoEstimado: 3,
    duracaoEstimada: 3,
    dataProgramada: '2025-01-18T08:00:00Z',
    horaProgramada: '08:00',
    dataInicioExecucao: '2025-01-18T08:00:00Z',
    dataFimExecucao: '2025-01-18T11:30:00Z',
    tempoRealExecucao: 3.5,
    responsavel: 'Ana Instrumentista',
    viatura: 'VTR-002',
    orcamentoPrevisto: 1200.00,
    custoReal: 1150.00,
    observacoes: 'Calibração conforme norma ISO 9001',
    observacoesExecucao: 'Calibração realizada com sucesso, certificado emitido',
    criadoPor: 'Sistema Automático',
    programadoPor: 'Maria Santos',
    finalizadoPor: 'Ana Instrumentista',
    atualizadoEm: '2025-01-18T11:30:00Z',
    materiais: [
      {
        id: '4-m1',
        descricao: 'Certificado de calibração',
        quantidade: 1,
        unidade: 'un',
        confirmado: true,
        disponivel: true,
        custo: 150.00
      }
    ],
    ferramentas: [
      {
        id: '4-f1',
        descricao: 'Calibrador de pressão Fluke 718',
        quantidade: 1,
        confirmada: true,
        disponivel: true
      }
    ],
    tecnicos: [
      {
        id: '4-t1',
        nome: 'Ana Instrumentista',
        especialidade: 'Técnico em Instrumentação',
        horasEstimadas: 3,
        custoHora: 110.00,
        disponivel: true
      }
    ],
    historico: [
      {
        id: '4-h1',
        acao: 'OS criada da tarefa CAL-003',
        usuario: 'Sistema Automático',
        data: '2025-01-12T16:45:00Z'
      },
      {
        id: '4-h2',
        acao: 'OS programada',
        usuario: 'Maria Santos',
        data: '2025-01-15T14:00:00Z'
      },
      {
        id: '4-h3',
        acao: 'Execução iniciada',
        usuario: 'Ana Instrumentista',
        data: '2025-01-18T08:00:00Z'
      },
      {
        id: '4-h4',
        acao: 'OS finalizada com sucesso',
        usuario: 'Ana Instrumentista',
        data: '2025-01-18T11:30:00Z',
        observacoes: 'Sensor calibrado e certificado emitido'
      }
    ]
  },
  {
    id: '5',
    criadoEm: '2025-01-22T09:20:00Z',
    numeroOS: 'OS-2025-005',
    descricao: 'Substituição de filtros do sistema de ar condicionado',
    local: 'Oficina João Silva',
    ativo: 'Sistema de Ar Condicionado',
    condicoes: 'FUNCIONANDO',
    status: 'PENDENTE',
    tipo: 'PREVENTIVA',
    prioridade: 'BAIXA',
    origem: 'MANUAL',
    plantaId: 4,
    equipamentoId: 4,
    tempoEstimado: 1,
    duracaoEstimada: 2,
    orcamentoPrevisto: 400.00,
    observacoes: 'Troca programada conforme cronograma de manutenção',
    criadoPor: 'Fernanda Lima',
    materiais: [
      {
        id: '5-m1',
        descricao: 'Filtros de ar condicionado 24x24',
        quantidade: 6,
        unidade: 'un',
        confirmado: false,
        disponivel: true,
        custo: 35.00
      }
    ],
    ferramentas: [
      {
        id: '5-f1',
        descricao: 'Chaves Phillips e fenda básicas',
        quantidade: 1,
        confirmada: false,
        disponivel: true
      }
    ],
    tecnicos: [
      {
        id: '5-t1',
        nome: 'Técnico de Refrigeração',
        especialidade: 'Refrigeração e Ar Condicionado',
        horasEstimadas: 1,
        custoHora: 75.00,
        disponivel: true
      }
    ],
    historico: [
      {
        id: '5-h1',
        acao: 'OS criada manualmente',
        usuario: 'Fernanda Lima',
        data: '2025-01-22T09:20:00Z'
      }
    ]
  },
  {
    id: '6',
    criadoEm: '2025-01-10T15:40:00Z',
    numeroOS: 'OS-2025-006',
    descricao: 'Reparo urgente no motor da bomba centrífuga',
    local: 'Estação de Bombeamento Sul',
    ativo: 'Motor Elétrico BCS-001',
    condicoes: 'PARADO',
    status: 'CANCELADA',
    tipo: 'CORRETIVA',
    prioridade: 'CRITICA',
    origem: 'ANOMALIA',
    plantaId: 3,
    equipamentoId: 13,
    anomaliaId: '4',
    tempoEstimado: 6,
    duracaoEstimada: 8,
    dataProgramada: '2025-01-12T06:00:00Z',
    horaProgramada: '06:00',
    responsavel: 'Carlos Ferreira',
    motivoCancelamento: 'Motor substituído por novo - reparo não necessário',
    orcamentoPrevisto: 3500.00,
    observacoes: 'Superaquecimento detectado por termografia',
    criadoPor: 'Ana Lima',
    atualizadoEm: '2025-01-13T10:00:00Z',
    materiais: [
      {
        id: '6-m1',
        descricao: 'Rolamentos do motor 6308',
        quantidade: 2,
        unidade: 'un',
        confirmado: true,
        disponivel: true,
        custo: 180.00
      }
    ],
    ferramentas: [
      {
        id: '6-f1',
        descricao: 'Extrator de rolamentos',
        quantidade: 1,
        confirmada: true,
        disponivel: true
      }
    ],
    tecnicos: [
      {
        id: '6-t1',
        nome: 'Carlos Ferreira',
        especialidade: 'Mecânico Industrial',
        horasEstimadas: 6,
        custoHora: 90.00,
        disponivel: true
      }
    ],
    historico: [
      {
        id: '6-h1',
        acao: 'OS criada da anomalia de superaquecimento',
        usuario: 'Ana Lima',
        data: '2025-01-10T15:40:00Z'
      },
      {
        id: '6-h2',
        acao: 'OS programada para execução urgente',
        usuario: 'João Silva',
        data: '2025-01-11T08:00:00Z'
      },
      {
        id: '6-h3',
        acao: 'OS cancelada - motor substituído',
        usuario: 'Carlos Ferreira',
        data: '2025-01-13T10:00:00Z',
        observacoes: 'Decisão técnica: substituir motor completo'
      }
    ]
  }
];