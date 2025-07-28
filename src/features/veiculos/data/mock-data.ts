// src/features/veiculos/data/mock-data.ts
import { Veiculo } from '../types';

export const mockVeiculos: Veiculo[] = [
  {
    id: 1,
    criadoEm: '2024-01-15T10:30:00Z',
    nome: 'Caminhonete 4x4 Toyota',
    tipo: 'veiculo',
    codigoPatrimonial: 'VEI-001',
    placa: 'ABC-1234',
    marca: 'Toyota',
    modelo: 'Hilux CD 4x4',
    anoFabricacao: 2022,
    tipoCombustivel: 'diesel',
    capacidadeCarga: 1000,
    autonomiaMedia: 12.5,
    valorDiaria: 250.00,
    documentacao: [
      {
        tipo: 'ipva',
        descricao: 'IPVA 2024',
        dataVencimento: '2024-12-31',
        valor: 2500.00
      },
      {
        tipo: 'seguro',
        descricao: 'Seguro Total - Porto Seguro',
        dataVencimento: '2024-08-15',
        valor: 3200.00
      },
      {
        tipo: 'licenciamento',
        descricao: 'Licenciamento 2024',
        dataVencimento: '2024-07-30',
        valor: 150.00
      }
    ],
    localizacaoAtual: 'Planta Industrial São Paulo - Pátio A',
    responsavel: 'João Silva',
    status: 'disponivel',
    quilometragem: 45000,
    observacoes: 'Veículo em excelente estado, recém revisado'
  },
  {
    id: 2,
    criadoEm: '2024-01-20T14:15:00Z',
    nome: 'Van Cargo Mercedes',
    tipo: 'veiculo',
    codigoPatrimonial: 'VEI-002',
    placa: 'DEF-5678',
    marca: 'Mercedes-Benz',
    modelo: 'Sprinter Cargo',
    anoFabricacao: 2021,
    tipoCombustivel: 'diesel',
    capacidadeCarga: 1500,
    autonomiaMedia: 10.8,
    valorDiaria: 180.00,
    documentacao: [
      {
        tipo: 'ipva',
        descricao: 'IPVA 2024',
        dataVencimento: '2024-12-31',
        valor: 1800.00
      },
      {
        tipo: 'seguro',
        descricao: 'Seguro Básico - Bradesco',
        dataVencimento: '2024-09-10',
        valor: 2100.00
      }
    ],
    localizacaoAtual: 'Centro de Distribuição Rio - Doca 2',
    responsavel: 'Maria Santos',
    status: 'em_uso',
    quilometragem: 78000,
    observacoes: 'Em rota de entrega até 18h'
  },
  {
    id: 3,
    criadoEm: '2024-02-05T09:20:00Z',
    nome: 'Sedan Executivo Civic',
    tipo: 'veiculo',
    codigoPatrimonial: 'VEI-003',
    placa: 'GHI-9012',
    marca: 'Honda',
    modelo: 'Civic EXL',
    anoFabricacao: 2023,
    tipoCombustivel: 'flex',
    capacidadeCarga: 500,
    autonomiaMedia: 14.2,
    valorDiaria: 120.00,
    documentacao: [
      {
        tipo: 'ipva',
        descricao: 'IPVA 2024',
        dataVencimento: '2024-12-31',
        valor: 1200.00
      },
      {
        tipo: 'seguro',
        descricao: 'Seguro Completo - Allianz',
        dataVencimento: '2024-11-20',
        valor: 2800.00
      },
      {
        tipo: 'revisao',
        descricao: 'Revisão dos 20.000km',
        dataVencimento: '2024-06-15',
        valor: 800.00
      }
    ],
    localizacaoAtual: 'Unidade Administrativa BH - Garagem',
    responsavel: 'Carlos Oliveira',
    status: 'disponivel',
    quilometragem: 18500,
    observacoes: 'Veículo novo, para uso executivo'
  },
  {
    id: 4,
    criadoEm: '2024-02-10T16:45:00Z',
    nome: 'Caminhão Baú Iveco',
    tipo: 'veiculo',
    codigoPatrimonial: 'VEI-004',
    placa: 'JKL-3456',
    marca: 'Iveco',
    modelo: 'Daily 70C16',
    anoFabricacao: 2020,
    tipoCombustivel: 'diesel',
    capacidadeCarga: 3500,
    autonomiaMedia: 8.5,
    valorDiaria: 300.00,
    documentacao: [
      {
        tipo: 'ipva',
        descricao: 'IPVA 2024',
        dataVencimento: '2024-12-31',
        valor: 3500.00
      },
      {
        tipo: 'seguro',
        descricao: 'Seguro Carga - SulAmérica',
        dataVencimento: '2024-07-05',
        valor: 4200.00
      }
    ],
    localizacaoAtual: 'Depósito Ana Costa - Pátio Externo',
    responsavel: 'Pedro Costa',
    status: 'manutencao',
    quilometragem: 125000,
    observacoes: 'Em manutenção preventiva - retorna em 3 dias'
  },
  {
    id: 5,
    criadoEm: '2024-02-18T15:10:00Z',
    nome: 'Motocicleta Honda CB',
    tipo: 'veiculo',
    codigoPatrimonial: 'VEI-005',
    placa: 'MNO-7890',
    marca: 'Honda',
    modelo: 'CB 600F Hornet',
    anoFabricacao: 2021,
    tipoCombustivel: 'gasolina',
    capacidadeCarga: 200,
    autonomiaMedia: 18.0,
    valorDiaria: 80.00,
    documentacao: [
      {
        tipo: 'ipva',
        descricao: 'IPVA 2024',
        dataVencimento: '2024-12-31',
        valor: 400.00
      },
      {
        tipo: 'seguro',
        descricao: 'Seguro Moto - Liberty',
        dataVencimento: '2024-10-12',
        valor: 1100.00
      }
    ],
    localizacaoAtual: 'Fábrica Indústria XYZ - Portaria',
    responsavel: 'Ana Costa',
    status: 'disponivel',
    quilometragem: 32000,
    observacoes: 'Para entregas rápidas e visitas técnicas'
  },
  {
    id: 6,
    criadoEm: '2024-02-25T11:30:00Z',
    nome: 'SUV Elétrico Tesla',
    tipo: 'veiculo',
    codigoPatrimonial: 'VEI-006',
    placa: 'PQR-1234',
    marca: 'Tesla',
    modelo: 'Model Y',
    anoFabricacao: 2023,
    tipoCombustivel: 'eletrico',
    capacidadeCarga: 800,
    autonomiaMedia: 0, // Para elétrico, usamos autonomia em km, não km/l
    valorDiaria: 400.00,
    documentacao: [
      {
        tipo: 'ipva',
        descricao: 'IPVA 2024 - Isento',
        dataVencimento: '2024-12-31',
        valor: 0
      },
      {
        tipo: 'seguro',
        descricao: 'Seguro Premium - Mapfre',
        dataVencimento: '2024-12-01',
        valor: 5500.00
      }
    ],
    localizacaoAtual: 'Unidade Logística Porto Alegre - Garagem Coberta',
    responsavel: 'Roberto Silva',
    status: 'disponivel',
    quilometragem: 8500,
    observacoes: 'Autonomia de 400km por carga. Carregador incluso.'
  },
  {
    id: 7,
    criadoEm: '2024-03-01T08:45:00Z',
    nome: 'Utilitário Fiorino',
    tipo: 'veiculo',
    codigoPatrimonial: 'VEI-007',
    placa: 'STU-5678',
    marca: 'Fiat',
    modelo: 'Fiorino Hard Working',
    anoFabricacao: 2019,
    tipoCombustivel: 'flex',
    capacidadeCarga: 650,
    autonomiaMedia: 11.5,
    valorDiaria: 90.00,
    documentacao: [
      {
        tipo: 'ipva',
        descricao: 'IPVA 2024',
        dataVencimento: '2024-12-31',
        valor: 600.00
      }
    ],
    localizacaoAtual: 'Filial Administrativa Brasília - Subsolo',
    responsavel: 'Fernanda Lima',
    status: 'inativo',
    quilometragem: 95000,
    observacoes: 'Aguardando decisão sobre venda ou reforma'
  }
];