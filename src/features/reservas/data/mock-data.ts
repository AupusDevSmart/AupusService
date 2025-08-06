// src/features/reservas/data/mock-data.ts
import { ReservaVeiculo } from '../types';

export const mockReservas: ReservaVeiculo[] = [
  {
    id: 1,
    criadoEm: '2025-01-25T09:00:00Z',
    veiculoId: 4, // Onix - em_uso
    solicitanteId: 'VIAGEM-2025-001',
    tipoSolicitante: 'viagem',
    dataInicio: '2025-02-10',
    dataFim: '2025-02-15',
    horaInicio: '08:00',
    horaFim: '18:00',
    responsavel: 'Maria Silva Santos',
    finalidade: 'Viagem administrativa para filial de Campinas',
    status: 'ativa',
    observacoes: 'Necessário abastecimento completo antes da viagem.',
    criadoPor: 'Administrador Sistema',
    dataReserva: '2025-01-25',
    kmInicial: 32100
  },
  {
    id: 2,
    criadoEm: '2025-01-28T14:30:00Z',
    veiculoId: 1, // Corolla
    solicitanteId: 'OS-2025-045',
    tipoSolicitante: 'ordem_servico',
    dataInicio: '2025-02-05',
    dataFim: '2025-02-05',
    horaInicio: '09:00',
    horaFim: '17:00',
    responsavel: 'Carlos Eduardo Oliveira',
    finalidade: 'Execução de OS-2025-045 - Manutenção cliente ABC',
    status: 'finalizada',
    observacoes: 'Serviço executado com sucesso.',
    criadoPor: 'Carlos Eduardo Oliveira',
    dataReserva: '2025-01-28',
    kmInicial: 25300,
    kmFinal: 25450,
    observacoesFinalizacao: 'Veículo retornado em perfeitas condições.'
  },
  {
    id: 3,
    criadoEm: '2025-01-30T10:15:00Z',
    veiculoId: 2, // Van Sprinter
    solicitanteId: 'MANUAL-2025-003',
    tipoSolicitante: 'manual',
    dataInicio: '2025-02-20',
    dataFim: '2025-02-22',
    horaInicio: '07:00',
    horaFim: '19:00',
    responsavel: 'João Silva Santos',
    finalidade: 'Transporte de equipe para treinamento em São José dos Campos',
    status: 'ativa',
    observacoes: 'Transportar 15 pessoas + equipamentos de treinamento.',
    criadoPor: 'João Silva Santos',
    dataReserva: '2025-01-30'
  },
  {
    id: 4,
    criadoEm: '2025-02-01T16:00:00Z',
    veiculoId: 6, // Moto Honda
    solicitanteId: 'MANUAL-2025-004',
    tipoSolicitante: 'manual',
    dataInicio: '2025-02-03',
    dataFim: '2025-02-03',
    horaInicio: '14:00',
    horaFim: '16:00',
    responsavel: 'Ana Paula Ferreira',
    finalidade: 'Entrega de documentos urgentes no centro',
    status: 'cancelada',
    observacoes: 'Cancelada devido a problema na moto.',
    motivoCancelamento: 'Veículo entrou em manutenção preventiva',
    criadoPor: 'Ana Paula Ferreira',
    dataReserva: '2025-02-01',
    dataCancelamento: '2025-02-02'
  },
  {
    id: 5,
    criadoEm: '2025-02-02T11:45:00Z',
    veiculoId: 3, // Pickup Ranger
    solicitanteId: 'OS-2025-067',
    tipoSolicitante: 'ordem_servico',
    dataInicio: '2025-02-18',
    dataFim: '2025-02-19',
    horaInicio: '06:00',
    horaFim: '18:00',
    responsavel: 'Pedro Henrique Machado',
    finalidade: 'OS-2025-067 - Instalação de equipamentos em obra',
    status: 'ativa',
    observacoes: 'Carregar ferramentas pesadas e materiais de instalação.',
    criadoPor: 'Supervisor de Campo',
    dataReserva: '2025-02-02'
  },
  {
    id: 6,
    criadoEm: '2025-01-20T13:20:00Z',
    veiculoId: 7, // SUV Tucson
    solicitanteId: 'VIAGEM-2025-002',
    tipoSolicitante: 'viagem',
    dataInicio: '2025-01-22',
    dataFim: '2025-01-25',
    horaInicio: '08:00',
    horaFim: '20:00',
    responsavel: 'Roberto Silva Lima',
    finalidade: 'Reunião estratégica com parceiros em Ribeirão Preto',
    status: 'finalizada',
    observacoes: 'Viagem executiva com pernoite.',
    criadoPor: 'Secretaria Executiva',
    dataReserva: '2025-01-20',
    kmInicial: 5000,
    kmFinal: 5200,
    observacoesFinalizacao: 'Viagem realizada com sucesso. Veículo em excelente estado.'
  },
  {
    id: 7,
    criadoEm: '2025-02-03T09:30:00Z',
    veiculoId: 5, // Caminhão Volvo
    solicitanteId: 'MANUT-2025-015',
    tipoSolicitante: 'manutencao',
    dataInicio: '2025-02-25',
    dataFim: '2025-02-26',
    horaInicio: '05:00',
    horaFim: '17:00',
    responsavel: 'Equipe de Manutenção Industrial',
    finalidade: 'Transporte de equipamentos para manutenção em cliente',
    status: 'ativa',
    observacoes: 'Carregamento de equipamentos pesados de manutenção.',
    criadoPor: 'Supervisor Manutenção',
    dataReserva: '2025-02-03'
  },
  {
    id: 8,
    criadoEm: '2025-01-15T15:10:00Z',
    veiculoId: 1, // Corolla
    solicitanteId: 'MANUAL-2025-001',
    tipoSolicitante: 'manual',
    dataInicio: '2025-01-18',
    dataFim: '2025-01-18',
    horaInicio: '10:00',
    horaFim: '15:00',
    responsavel: 'Fernanda Lima Souza',
    finalidade: 'Reunião com fornecedores no centro da cidade',
    status: 'finalizada',
    observacoes: 'Reunião comercial importante.',
    criadoPor: 'Fernanda Lima Souza',
    dataReserva: '2025-01-15',
    kmInicial: 25100,
    kmFinal: 25250,
    observacoesFinalizacao: 'Reunião produtiva, veículo retornado sem problemas.'
  }
];