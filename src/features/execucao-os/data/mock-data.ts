// src/features/execucao-os/data/mock-data.ts
import { ExecucaoOS } from '../types';

// Mock das execuções de OS
export const mockExecucoesOS: ExecucaoOS[] = [
  {
    id: 1,
    os: {
      id: 1,
      numeroOS: 'OS-2025-001',
      descricao: 'Manutenção preventiva do motor principal',
      local: 'Planta Industrial A',
      ativo: 'Motor 001 - Bomba Principal',
      condicoes: 'PARADO',
      status: 'EM_EXECUCAO',
      tipo: 'PREVENTIVA',
      prioridade: 'ALTA',
      origem: 'TAREFA',
      dataProgramada: '2025-08-04',
      horaProgramada: '08:00',
      responsavel: 'João Silva',
      viatura: {
        veiculoId: 1,
        dataInicio: '2025-08-04',
        dataFim: '2025-08-04',
        horaInicio: '08:00',
        horaFim: '17:00',
        solicitanteId: '1',
        tipoSolicitante: 'ordem_servico' as const,
        responsavel: 'João Silva',
        finalidade: 'Execução de OS - Manutenção preventiva do motor principal'
      },
      tempoEstimado: 6,
      duracaoEstimada: 8,
      materiais: [],
      ferramentas: [],
      tecnicos: [],
      criadoEm: '2025-08-01T10:00:00Z'
    },
    statusExecucao: 'EM_EXECUCAO',
    dataInicioReal: '2025-08-04',
    horaInicioReal: '08:15',
    tempoTotalExecucao: 240, // 4 horas
    equipePresente: ['João Silva', 'Carlos Santos', 'Pedro Lima'],
    responsavelExecucao: 'João Silva',
    
    materiaisConsumidos: [
      {
        id: 'mat_001',
        materialId: 'oil_001',
        descricao: 'Óleo lubrificante SAE 30',
        quantidadePlanejada: 5,
        quantidadeConsumida: 4.8,
        unidade: 'L',
        custo: 45.50,
        observacoes: 'Consumo dentro do esperado'
      },
      {
        id: 'mat_002',
        materialId: 'filter_001',
        descricao: 'Filtro de óleo',
        quantidadePlanejada: 1,
        quantidadeConsumida: 1,
        unidade: 'UN',
        custo: 25.00
      }
    ],
    
    ferramentasUtilizadas: [
      {
        id: 'ferr_001',
        ferramentaId: 'wrench_001',
        descricao: 'Chave de fenda 32mm',
        utilizada: true,
        condicaoAntes: 'Boa',
        condicaoDepois: 'Boa',
        observacoes: 'Ferramenta em perfeito estado'
      }
    ],
    
    registrosTempoTecnicos: [
      {
        id: 'tempo_001',
        osId: 'os_001',
        tecnicoId: 'tec_001',
        tecnicoNome: 'João Silva',
        dataInicio: '2025-08-04',
        horaInicio: '08:15',
        dataFim: '2025-08-04',
        horaFim: '12:15',
        tempoTotal: 240,
        atividade: 'Desmontagem e limpeza do motor',
        observacoes: 'Procedimento executado conforme manual'
      }
    ],
    
    checklistAtividades: [
      {
        id: 'check_001',
        osId: 'os_001',
        atividade: 'Desligar equipamento',
        concluida: true,
        concluidaEm: '2025-08-04T08:15:00Z',
        concluidaPor: 'João Silva'
      },
      {
        id: 'check_002',
        osId: 'os_001',
        atividade: 'Drenar óleo usado',
        concluida: true,
        concluidaEm: '2025-08-04T08:30:00Z',
        concluidaPor: 'João Silva'
      },
      {
        id: 'check_003',
        osId: 'os_001',
        atividade: 'Trocar filtro de óleo',
        concluida: true,
        concluidaEm: '2025-08-04T09:15:00Z',
        concluidaPor: 'Carlos Santos'
      },
      {
        id: 'check_004',
        osId: 'os_001',
        atividade: 'Adicionar óleo novo',
        concluida: false
      }
    ],
    
    anexos: [
      {
        id: 'anexo_001',
        osId: 'os_001',
        tipo: 'foto_antes',
        nome: 'motor_antes.jpg',
        url: '/uploads/motor_antes.jpg',
        descricao: 'Estado do motor antes da manutenção',
        uploadedAt: '2025-08-04T08:10:00Z',
        uploadedBy: 'João Silva'
      }
    ],
    
    resultadoServico: '',
    criadoEm: '2025-08-04T08:15:00Z'
  },
  
  {
    id: 2,
    os: {
      id: 2,
      numeroOS: 'OS-2025-002',
      descricao: 'Inspeção de segurança - Válvulas de pressão',
      local: 'Planta Industrial B',
      ativo: 'Válvula 003 - Sistema de Pressão',
      condicoes: 'FUNCIONANDO',
      status: 'PROGRAMADA',
      tipo: 'INSPECAO',
      prioridade: 'MEDIA',
      origem: 'MANUAL',
      dataProgramada: '2025-08-04',
      horaProgramada: '14:00',
      responsavel: 'Maria Santos',
      tempoEstimado: 3,
      duracaoEstimada: 4,
      materiais: [],
      ferramentas: [],
      tecnicos: [],
      criadoEm: '2025-08-02T14:00:00Z'
    },
    statusExecucao: 'PROGRAMADA',
    equipePresente: [],
    responsavelExecucao: 'Maria Santos',
    materiaisConsumidos: [],
    ferramentasUtilizadas: [],
    registrosTempoTecnicos: [],
    checklistAtividades: [
      {
        id: 'check_005',
        osId: 'os_002',
        atividade: 'Verificar pressão de operação',
        concluida: false
      },
      {
        id: 'check_006',
        osId: 'os_002',
        atividade: 'Testar válvulas de segurança',
        concluida: false
      },
      {
        id: 'check_007',
        osId: 'os_002',
        atividade: 'Documentar resultados',
        concluida: false
      }
    ],
    anexos: [],
    resultadoServico: '',
    criadoEm: '2025-08-02T14:00:00Z'
  },
  
  {
    id: 3,
    os: {
      id: 3,
      numeroOS: 'OS-2025-003',
      descricao: 'Reparo corretivo - Vazamento na tubulação',
      local: 'Escritório Central',
      ativo: 'Tubulação 005 - Ar Condicionado',
      condicoes: 'PARADO',
      status: 'FINALIZADA',
      tipo: 'CORRETIVA',
      prioridade: 'CRITICA',
      origem: 'ANOMALIA',
      dataProgramada: '2025-08-03',
      horaProgramada: '09:00',
      responsavel: 'Carlos Oliveira',
      tempoEstimado: 4,
      duracaoEstimada: 5,
      materiais: [],
      ferramentas: [],
      tecnicos: [],
      criadoEm: '2025-08-03T08:00:00Z'
    },
    statusExecucao: 'FINALIZADA',
    dataInicioReal: '2025-08-03',
    horaInicioReal: '09:10',
    dataFimReal: '2025-08-03',
    horaFimReal: '13:45',
    tempoTotalExecucao: 275, // 4h35min
    equipePresente: ['Carlos Oliveira', 'Ana Costa'],
    responsavelExecucao: 'Carlos Oliveira',
    
    materiaisConsumidos: [
      {
        id: 'mat_003',
        materialId: 'tube_001',
        descricao: 'Tubo PVC 3/4"',
        quantidadePlanejada: 2,
        quantidadeConsumida: 1.5,
        unidade: 'M',
        custo: 12.50
      },
      {
        id: 'mat_004',
        materialId: 'glue_001',
        descricao: 'Cola para PVC',
        quantidadePlanejada: 1,
        quantidadeConsumida: 0.3,
        unidade: 'L',
        custo: 8.90
      }
    ],
    
    ferramentasUtilizadas: [
      {
        id: 'ferr_002',
        ferramentaId: 'saw_001',
        descricao: 'Serra para PVC',
        utilizada: true,
        condicaoAntes: 'Boa',
        condicaoDepois: 'Boa'
      }
    ],
    
    registrosTempoTecnicos: [
      {
        id: 'tempo_002',
        osId: 'os_003',
        tecnicoId: 'tec_002',
        tecnicoNome: 'Carlos Oliveira',
        dataInicio: '2025-08-03',
        horaInicio: '09:10',
        dataFim: '2025-08-03',
        horaFim: '13:45',
        tempoTotal: 275,
        atividade: 'Reparo de vazamento na tubulação',
        observacoes: 'Substituição de 1,5m de tubulação'
      }
    ],
    
    checklistAtividades: [
      {
        id: 'check_008',
        osId: 'os_003',
        atividade: 'Identificar ponto de vazamento',
        concluida: true,
        concluidaEm: '2025-08-03T09:20:00Z',
        concluidaPor: 'Carlos Oliveira'
      },
      {
        id: 'check_009',
        osId: 'os_003',
        atividade: 'Cortar tubulação danificada',
        concluida: true,
        concluidaEm: '2025-08-03T10:30:00Z',
        concluidaPor: 'Carlos Oliveira'
      },
      {
        id: 'check_010',
        osId: 'os_003',
        atividade: 'Instalar nova tubulação',
        concluida: true,
        concluidaEm: '2025-08-03T12:15:00Z',
        concluidaPor: 'Carlos Oliveira'
      },
      {
        id: 'check_011',
        osId: 'os_003',
        atividade: 'Testar pressão do sistema',
        concluida: true,
        concluidaEm: '2025-08-03T13:30:00Z',
        concluidaPor: 'Ana Costa'
      }
    ],
    
    anexos: [
      {
        id: 'anexo_002',
        osId: 'os_003',
        tipo: 'foto_antes',
        nome: 'vazamento_antes.jpg',
        url: '/uploads/vazamento_antes.jpg',
        descricao: 'Vazamento identificado na tubulação',
        uploadedAt: '2025-08-03T09:15:00Z',
        uploadedBy: 'Carlos Oliveira'
      },
      {
        id: 'anexo_003',
        osId: 'os_003',
        tipo: 'foto_depois',
        nome: 'reparo_concluido.jpg',
        url: '/uploads/reparo_concluido.jpg',
        descricao: 'Reparo finalizado e testado',
        uploadedAt: '2025-08-03T13:40:00Z',
        uploadedBy: 'Ana Costa'
      }
    ],
    
    resultadoServico: 'Vazamento reparado com sucesso. Substituída tubulação de 1,5m. Sistema testado e funcionando normalmente.',
    problemasEncontrados: 'Tubulação estava mais deteriorada que o esperado',
    recomendacoes: 'Realizar inspeção geral em toda a rede de tubulação do andar',
    proximaManutencao: 'Inspeção preventiva em 6 meses',
    avaliacaoQualidade: 5,
    observacoesQualidade: 'Serviço executado com excelência',
    aprovadoPor: 'Supervisor Técnico',
    dataAprovacao: '2025-08-03T14:00:00Z',
    criadoEm: '2025-08-03T09:10:00Z'
  }
];

// Mock de técnicos disponíveis
export const mockTecnicos = [
  { id: 'tec_001', nome: 'João Silva', especialidade: 'Mecânica' },
  { id: 'tec_002', nome: 'Carlos Oliveira', especialidade: 'Hidráulica' },
  { id: 'tec_003', nome: 'Maria Santos', especialidade: 'Elétrica' },
  { id: 'tec_004', nome: 'Ana Costa', especialidade: 'Instrumentação' },
  { id: 'tec_005', nome: 'Pedro Lima', especialidade: 'Soldas' }
];

// Mock de materiais disponíveis
export const mockMateriaisDisponiveis = [
  { id: 'oil_001', descricao: 'Óleo lubrificante SAE 30', unidade: 'L', estoque: 50 },
  { id: 'filter_001', descricao: 'Filtro de óleo', unidade: 'UN', estoque: 25 },
  { id: 'tube_001', descricao: 'Tubo PVC 3/4"', unidade: 'M', estoque: 100 },
  { id: 'glue_001', descricao: 'Cola para PVC', unidade: 'L', estoque: 10 },
  { id: 'gasket_001', descricao: 'Junta de vedação', unidade: 'UN', estoque: 30 }
];

// Mock de ferramentas disponíveis
export const mockFerramentasDisponiveis = [
  { id: 'wrench_001', descricao: 'Chave de fenda 32mm', disponivel: true },
  { id: 'saw_001', descricao: 'Serra para PVC', disponivel: true },
  { id: 'drill_001', descricao: 'Furadeira', disponivel: false },
  { id: 'meter_001', descricao: 'Multímetro', disponivel: true },
  { id: 'torch_001', descricao: 'Maçarico', disponivel: true }
];