// src/features/ferramentas/data/mock-data.ts
import { Ferramenta } from '../types';

export const mockFerramentas: Ferramenta[] = [
  {
    id: 1,
    criadoEm: '2024-01-15T10:30:00Z',
    nome: 'Multímetro Digital Fluke',
    tipo: 'ferramenta',
    codigoPatrimonial: 'FER-001',
    fabricante: 'Fluke',
    modelo: '87V',
    numeroSerie: 'FLK87V-12345',
    necessitaCalibracao: true,
    proximaDataCalibracao: '2024-08-15',
    valorDiaria: 25.00,
    localizacaoAtual: 'Planta Industrial São Paulo - Laboratório',
    responsavel: 'João Silva',
    dataAquisicao: '2023-06-10',
    status: 'disponivel',
    observacoes: 'Multímetro de alta precisão para medições elétricas',
    historicoCalibracao: [
      {
        data: '2024-02-15',
        responsavel: 'Laboratório MegaCal',
        observacoes: 'Calibração conforme ISO 17025'
      },
      {
        data: '2023-08-15',
        responsavel: 'Laboratório MegaCal',
        observacoes: 'Primeira calibração após aquisição'
      }
    ]
  },
  {
    id: 2,
    criadoEm: '2024-01-20T14:15:00Z',
    nome: 'Torquímetro Digital',
    tipo: 'ferramenta',
    codigoPatrimonial: 'FER-002',
    fabricante: 'Gedore',
    modelo: 'DREMOMETER A',
    numeroSerie: 'GED-TQ-9876',
    necessitaCalibracao: true,
    proximaDataCalibracao: '2024-07-20',
    valorDiaria: 35.00,
    localizacaoAtual: 'Centro de Distribuição Rio - Oficina',
    responsavel: 'Maria Santos',
    dataAquisicao: '2023-09-22',
    status: 'em_uso',
    observacoes: 'Para aperto de parafusos com precisão de torque',
    historicoCalibracao: [
      {
        data: '2024-01-20',
        responsavel: 'TecCal Instrumentos',
        observacoes: 'Calibração semestral realizada'
      }
    ]
  },
  {
    id: 3,
    criadoEm: '2024-02-05T09:20:00Z',
    nome: 'Furadeira de Impacto Profissional',
    tipo: 'ferramenta',
    codigoPatrimonial: 'FER-003',
    fabricante: 'Bosch',
    modelo: 'GSB 20-2 RE',
    numeroSerie: 'BSH-GSB-5432',
    necessitaCalibracao: false,
    valorDiaria: 15.00,
    localizacaoAtual: 'Unidade Administrativa BH - Almoxarifado',
    responsavel: 'Carlos Oliveira',
    dataAquisicao: '2023-11-15',
    status: 'disponivel',
    observacoes: 'Furadeira com percussão para concreto e alvenaria'
  },
  {
    id: 4,
    criadoEm: '2024-02-10T16:45:00Z',
    nome: 'Micrometro Externo',
    tipo: 'ferramenta',
    codigoPatrimonial: 'FER-004',
    fabricante: 'Mitutoyo',
    modelo: '103-137',
    numeroSerie: 'MIT-MIC-7890',
    necessitaCalibracao: true,
    proximaDataCalibracao: '2024-06-10',
    valorDiaria: 20.00,
    localizacaoAtual: 'Depósito Ana Costa - Sala de Medição',
    responsavel: 'Pedro Costa',
    dataAquisicao: '2023-12-05',
    status: 'disponivel',
    observacoes: 'Micrometro de 0-25mm com resolução de 0,01mm',
    historicoCalibracao: [
      {
        data: '2023-12-10',
        responsavel: 'Instituto de Metrologia',
        observacoes: 'Calibração inicial pós-aquisição'
      }
    ]
  },
  {
    id: 5,
    criadoEm: '2024-02-18T15:10:00Z',
    nome: 'Chave de Impacto Pneumática',
    tipo: 'ferramenta',
    codigoPatrimonial: 'FER-005',
    fabricante: 'Chicago Pneumatic',
    modelo: 'CP7755',
    numeroSerie: 'CPT-CI-1234',
    necessitaCalibracao: false,
    valorDiaria: 18.00,
    localizacaoAtual: 'Fábrica Indústria XYZ - Linha de Montagem',
    responsavel: 'Ana Costa',
    dataAquisicao: '2024-01-08',
    status: 'em_uso',
    observacoes: 'Chave de impacto para parafusos de alta resistência'
  },
  {
    id: 6,
    criadoEm: '2024-02-25T11:30:00Z',
    nome: 'Osciloscópio Digital',
    tipo: 'ferramenta',
    codigoPatrimonial: 'FER-006',
    fabricante: 'Tektronix',
    modelo: 'TBS1052B',
    numeroSerie: 'TEK-OSC-5678',
    necessitaCalibracao: true,
    proximaDataCalibracao: '2024-09-25',
    valorDiaria: 45.00,
    localizacaoAtual: 'Unidade Logística Porto Alegre - Bancada Eletrônica',
    responsavel: 'Roberto Silva',
    dataAquisicao: '2023-05-18',
    status: 'disponivel',
    observacoes: 'Osciloscópio de 2 canais, 50MHz',
    historicoCalibracao: [
      {
        data: '2024-03-25',
        responsavel: 'Calibra Tech',
        observacoes: 'Calibração anual realizada conforme procedimento'
      }
    ]
  },
  {
    id: 7,
    criadoEm: '2024-03-01T08:45:00Z',
    nome: 'Serra Circular Portátil',
    tipo: 'ferramenta',
    codigoPatrimonial: 'FER-007',
    fabricante: 'Makita',
    modelo: '5007MG',
    numeroSerie: 'MAK-SC-9999',
    necessitaCalibracao: false,
    valorDiaria: 12.00,
    localizacaoAtual: 'Filial Administrativa Brasília - Almoxarifado',
    responsavel: 'Fernanda Lima',
    dataAquisicao: '2024-02-14',
    status: 'disponivel',
    observacoes: 'Serra circular com motor de magnésio, lâmina 7¼"'
  },
  {
    id: 8,
    criadoEm: '2024-03-10T13:20:00Z',
    nome: 'Medidor de Espessura Ultrassônico',
    tipo: 'ferramenta',
    codigoPatrimonial: 'FER-008',
    fabricante: 'GE',
    modelo: 'DM5E',
    numeroSerie: 'GE-DM5E-4321',
    necessitaCalibracao: true,
    proximaDataCalibracao: '2024-05-15',
    valorDiaria: 55.00,
    localizacaoAtual: 'Planta Industrial São Paulo - Setor de Qualidade',
    responsavel: 'João Silva',
    dataAquisicao: '2023-08-30',
    status: 'manutencao',
    observacoes: 'Em manutenção - sensor do transdutor apresentou defeito',
    historicoCalibracao: [
      {
        data: '2023-11-15',
        responsavel: 'NDT Calibração',
        observacoes: 'Calibração com padrões rastreados'
      }
    ]
  },
  {
    id: 9,
    criadoEm: '2024-03-15T10:15:00Z',
    nome: 'Alicate Amperímetro',
    tipo: 'ferramenta',
    codigoPatrimonial: 'FER-009',
    fabricante: 'Fluke',
    modelo: '376 FC',
    numeroSerie: 'FLK376-8765',
    necessitaCalibracao: true,
    proximaDataCalibracao: '2024-12-01',
    valorDiaria: 30.00,
    localizacaoAtual: 'Centro de Distribuição Rio - Sala Elétrica',
    responsavel: 'Maria Santos',
    dataAquisicao: '2023-04-12',
    status: 'disponivel',
    observacoes: 'Alicate True RMS com conectividade Bluetooth',
    historicoCalibracao: [
      {
        data: '2023-06-01',
        responsavel: 'Laboratório MegaCal',
        observacoes: 'Calibração inicial conforme ISO 17025'
      }
    ]
  },
  {
    id: 10,
    criadoEm: '2024-03-20T16:30:00Z',
    nome: 'Esmerilhadeira Angular',
    tipo: 'ferramenta',
    codigoPatrimonial: 'FER-010',
    fabricante: 'DeWalt',
    modelo: 'DWE4120',
    numeroSerie: 'DWT-ESM-1111',
    necessitaCalibracao: false,
    valorDiaria: 10.00,
    localizacaoAtual: 'Fábrica Indústria XYZ - Solda',
    responsavel: 'Pedro Costa',
    dataAquisicao: '2024-01-25',
    status: 'disponivel',
    observacoes: 'Esmerilhadeira 4½" para corte e desbaste'
  }
];