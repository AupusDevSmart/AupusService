// src/features/reservas/types/index.ts
import { BaseEntity, type BaseFilters as BaseFiltersType, ModalMode } from '@/types/base';

// Status e enums
export type StatusReserva = 'ativa' | 'finalizada' | 'cancelada' | 'vencida';
export type TipoSolicitante = 'ordem_servico' | 'viagem' | 'manutencao' | 'manual';
export type StatusVeiculo = 'disponivel' | 'em_uso' | 'manutencao' | 'inativo';
export type TipoCombustivel = 'gasolina' | 'etanol' | 'diesel' | 'gnv' | 'eletrico' | 'hibrido' | 'flex';
export type TipoVeiculo = 'carro' | 'van' | 'caminhonete' | 'caminhao' | 'onibus' | 'moto';

// Interface para veículo - corrigida para compatibilidade
export interface Veiculo extends BaseEntity {
  nome: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor?: string;
  status: StatusVeiculo;
  tipo?: TipoVeiculo;
  tipoCombustivel: TipoCombustivel;
  // Compatibilidade: aceita tanto numeroPassageiros quanto capacidadePassageiros
  numeroPassageiros?: number;
  capacidadePassageiros?: number;
  capacidadeCarga?: number; // em kg, opcional
  // Compatibilidade: aceita tanto quilometragem quanto kmAtual
  quilometragem?: number;
  kmAtual?: number;
  proximaRevisao?: string; // YYYY-MM-DD
  // Compatibilidade: aceita tanto responsavel quanto responsavelManutencao
  responsavel?: string;
  responsavelManutencao?: string;
  localizacaoAtual: string;
  valorDiaria?: number; // Adicionado para compatibilidade
  observacoes?: string;
  chassi?: string;
  renavam?: string;
  seguradora?: string;
  vencimentoSeguro?: string; // YYYY-MM-DD
}

// Interface para reserva completa - corrigida para compatibilidade
export interface ReservaVeiculo extends BaseEntity {
  veiculoId: number;
  solicitanteId?: string;
  tipoSolicitante: TipoSolicitante;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string;
  horaInicio: string; // HH:mm
  horaFim: string;
  responsavel: string;
  finalidade: string;
  status: StatusReserva;
  observacoes?: string;
  motivoCancelamento?: string;
  criadoPor?: string;
  dataReserva?: string;
  dataCancelamento?: string;
  kmInicial?: number;
  kmFinal?: number;
  observacoesFinalizacao?: string;
}

// Para formulários de reserva - corrigida para compatibilidade
export interface ReservaFormData {
  veiculoId?: number;
  solicitanteId?: string;
  tipoSolicitante: TipoSolicitante;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  responsavel: string;
  finalidade: string;
  observacoes?: string;
}

// Para formulários de veículo - corrigida para compatibilidade
export interface VeiculoFormData {
  nome: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor?: string;
  status?: StatusVeiculo;
  tipo?: TipoVeiculo;
  tipoCombustivel: TipoCombustivel;
  // Compatibilidade: aceita tanto numeroPassageiros quanto capacidadePassageiros
  numeroPassageiros?: number;
  capacidadePassageiros?: number;
  capacidadeCarga?: number;
  // Compatibilidade: aceita tanto quilometragem quanto kmAtual
  quilometragem?: number;
  kmAtual?: number;
  proximaRevisao?: string;
  // Compatibilidade: aceita tanto responsavel quanto responsavelManutencao
  responsavel?: string;
  responsavelManutencao?: string;
  localizacaoAtual: string;
  valorDiaria?: number;
  observacoes?: string;
  chassi?: string;
  renavam?: string;
  seguradora?: string;
  vencimentoSeguro?: string;
}

// Para o ViaturaSelector
export interface ViaturaReservada {
  veiculoId: number;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  responsavel?: string;
  finalidade?: string;
}

// Para verificação de disponibilidade
export interface FiltrosDisponibilidade {
  dataInicio: string;
  dataFim: string;
  horaInicio?: string;
  horaFim?: string;
  excluirReservaId?: string;
}

export interface DisponibilidadeVeiculo {
  veiculoId: number;
  disponivel: boolean;
  conflitos: ReservaVeiculo[];
  proximaDisponibilidade?: {
    dataInicio: string;
    horaInicio: string;
  };
}

// Filtros para as páginas
export interface ReservasFilters extends BaseFiltersType {
  status: string;
  tipoSolicitante: string;
  responsavel: string;
  dataInicio: string;
  dataFim: string;
}

export interface VeiculosFilters extends BaseFiltersType {
  status: string;
  tipo: string;
  tipoCombustivel: string;
  marca: string;
}

// Estados dos modais
export interface ReservaModalState {
  isOpen: boolean;
  mode: ModalMode;
  reserva: ReservaVeiculo | null;
}

export interface VeiculoModalState {
  isOpen: boolean;
  mode: ModalMode;
  veiculo: Veiculo | null;
}

export { type ModalMode };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};