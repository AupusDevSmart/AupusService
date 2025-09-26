// src/features/programacao-os/data/mock-data.ts
import { ProgramacaoResponse } from '../types';

export const mockOrdensServico: ProgramacaoResponse[] = [
  {
    id: '1',
    criadoEm: '2025-01-20T08:00:00Z',
    codigo: 'OS-2025-001',
    descricao: 'Manutenção preventiva do sistema de controle principal',
    local: 'Planta Industrial São Paulo',
    ativo: 'Sistema de Controle Principal',
    condicoes: 'PARADO',
    status: 'PENDENTE',
    tipo: 'PREVENTIVA',
    prioridade: 'ALTA',
    origem: 'TAREFA',
    planta_id: '1',
    equipamento_id: '1',
    tempo_estimado: 4,
    duracao_estimada: 6,
    data_hora_programada: '2025-02-15T08:00:00Z',
    responsavel: 'João Silva',
    time_equipe: 'Equipe Elétrica',
    orcamento_previsto: 2500.00,
    observacoes: 'Verificar todos os componentes conforme checklist',
    observacoes_programacao: 'Coordenar com operação para parada do equipamento',
    criado_por: 'Sistema Automático',
    atualizadoEm: '2025-01-22T14:30:00Z',
    necessita_veiculo: true,
    // Campos de compatibilidade
    data_programada: '2025-02-15T08:00:00Z',
    hora_programada: '08:00',
    viatura: 1,
    materiais: [
      {
        id: '1-m1',
        programacao_id: '1',
        descricao: 'Óleo isolante Shell Diala S3 ZX-I',
        quantidade_planejada: 20,
        unidade: 'L',
        custo_unitario: 45.00,
        custo_total: 900.00
      },
      {
        id: '1-m2',
        programacao_id: '1',
        descricao: 'Filtros de ar condicionado',
        quantidade_planejada: 4,
        unidade: 'un',
        custo_unitario: 120.00,
        custo_total: 480.00
      }
    ],
    ferramentas: [
      {
        id: '1-f1',
        programacao_id: '1',
        descricao: 'Multímetro digital',
        quantidade: 2
      },
      {
        id: '1-f2',
        programacao_id: '1',
        descricao: 'Chave de fenda isolada',
        quantidade: 1
      }
    ],
    tecnicos: [
      {
        id: '1-t1',
        programacao_id: '1',
        nome: 'João Silva',
        especialidade: 'Técnico Elétrico',
        horas_estimadas: 4,
        custo_hora: 85.00,
        custo_total: 340.00
      },
      {
        id: '1-t2',
        programacao_id: '1',
        nome: 'Pedro Santos',
        especialidade: 'Técnico Mecânico',
        horas_estimadas: 4,
        custo_hora: 80.00,
        custo_total: 320.00
      }
    ],
    historico: [
      {
        id: '1-h1',
        programacao_id: '1',
        acao: 'Programação criada',
        usuario: 'Sistema Automático',
        data: '2025-01-20T08:00:00Z'
      },
      {
        id: '1-h2',
        programacao_id: '1',
        acao: 'Programação aprovada',
        usuario: 'Maria Santos',
        data: '2025-01-22T14:30:00Z'
      }
    ]
  },
  {
    id: '2',
    criadoEm: '2025-01-18T10:30:00Z',
    codigo: 'OS-2025-002',
    descricao: 'Correção de vazamento na válvula de segurança',
    local: 'Planta Química Rio de Janeiro',
    ativo: 'Válvula de Segurança Principal',
    condicoes: 'FUNCIONANDO',
    status: 'EM_ANALISE',
    tipo: 'CORRETIVA',
    prioridade: 'CRITICA',
    origem: 'ANOMALIA',
    planta_id: '2',
    equipamento_id: '2',
    anomalia_id: '1',
    tempo_estimado: 6,
    duracao_estimada: 8,
    orcamento_previsto: 1800.00,
    observacoes: 'Vazamento detectado durante vistoria de rotina',
    criado_por: 'Operador Turno A',
    atualizadoEm: '2025-01-19T16:45:00Z',
    necessita_veiculo: false,
    materiais: [
      {
        id: '2-m1',
        programacao_id: '2',
        descricao: 'Kit de vedação para válvula',
        quantidade_planejada: 1,
        unidade: 'kit',
        custo_unitario: 350.00,
        custo_total: 350.00
      },
      {
        id: '2-m2',
        programacao_id: '2',
        descricao: 'Lubrificante industrial',
        quantidade_planejada: 2,
        unidade: 'L',
        custo_unitario: 75.00,
        custo_total: 150.00
      }
    ],
    ferramentas: [
      {
        id: '2-f1',
        programacao_id: '2',
        descricao: 'Chave inglesa 24mm',
        quantidade: 1
      },
      {
        id: '2-f2',
        programacao_id: '2',
        descricao: 'Torquímetro',
        quantidade: 1
      }
    ],
    tecnicos: [
      {
        id: '2-t1',
        programacao_id: '2',
        nome: 'Carlos Lima',
        especialidade: 'Técnico Mecânico',
        horas_estimadas: 6,
        custo_hora: 90.00,
        custo_total: 540.00
      },
      {
        id: '2-t2',
        programacao_id: '2',
        nome: 'Ana Costa',
        especialidade: 'Técnico de Segurança',
        horas_estimadas: 2,
        custo_hora: 70.00,
        custo_total: 140.00
      }
    ],
    historico: [
      {
        id: '2-h1',
        programacao_id: '2',
        acao: 'Anomalia reportada',
        usuario: 'Operador Turno A',
        data: '2025-01-18T10:30:00Z'
      },
      {
        id: '2-h2',
        programacao_id: '2',
        acao: 'Programação criada',
        usuario: 'Sistema Automático',
        data: '2025-01-18T11:00:00Z'
      }
    ]
  }
];

export default mockOrdensServico;