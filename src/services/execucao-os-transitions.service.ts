// src/services/execucao-os-transitions.service.ts
// Service for handling OS status transitions

import { api } from '@/config/api';

export type StatusExecucaoOS =
  | 'PLANEJADA'
  | 'PROGRAMADA'
  | 'EM_EXECUCAO'
  | 'PAUSADA'
  | 'FINALIZADA'
  | 'CANCELADA';

// ============================================================================
// DTOs para transições de status
// ============================================================================

export interface ProgramarOSDto {
  data_hora_programada: string; // ISO DateTime
  responsavel: string;
  responsavel_id?: string;
  time_equipe?: string;
  materiais_confirmados: string[];
  ferramentas_confirmadas: string[];
  tecnicos_confirmados: string[];
  reserva_veiculo?: {
    veiculo_id: string;
    data_inicio: string;
    data_fim: string;
    hora_inicio: string;
    hora_fim: string;
    finalidade: string;
    km_inicial?: number;
  };
  observacoes_programacao?: string;
}

export interface IniciarExecucaoDto {
  equipe_presente: string[];
  responsavel_execucao: string;
  observacoes_inicio?: string;
  data_hora_inicio_real?: string; // ISO DateTime
}

export interface PausarExecucaoDto {
  motivo_pausa: string;
  observacoes?: string;
}

export interface RetomarExecucaoDto {
  observacoes_retomada?: string;
}

export interface MaterialFinalizacaoDto {
  id: string;
  quantidade_consumida: number;
  observacoes?: string;
}

export interface FerramentaFinalizacaoDto {
  id: string;
  condicao_depois: string;
  observacoes?: string;
}

export interface FinalizarOSDto {
  data_hora_fim_real?: string; // ISO DateTime
  resultado_servico: string;
  problemas_encontrados?: string;
  recomendacoes?: string;
  proxima_manutencao?: string; // ISO Date
  materiais_consumidos: MaterialFinalizacaoDto[];
  ferramentas_utilizadas: FerramentaFinalizacaoDto[];
  avaliacao_qualidade: number; // 1-5
  observacoes_qualidade?: string;
  km_final?: number;
  observacoes_veiculo?: string;
}

export interface CancelarOSDto {
  motivo_cancelamento: string;
  observacoes?: string;
}

// ============================================================================
// Service
// ============================================================================

export class ExecucaoOSTransitionsService {
  private readonly baseEndpoint = '/execucao-os';

  /**
   * Transição: PLANEJADA → PROGRAMADA
   * Define data/hora e confirma recursos para a OS
   */
  async programar(id: string, data: ProgramarOSDto): Promise<{ message: string }> {
    console.log('📅 PROGRAMAR OS:', id, data);

    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/programar`,
        data
      );
      console.log('✅ OS Programada com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao programar OS:', error);
      throw error;
    }
  }

  /**
   * Transição: PROGRAMADA → EM_EXECUCAO
   * Inicia a execução da OS com equipe definida
   */
  async iniciar(id: string, data: IniciarExecucaoDto): Promise<{ message: string }> {
    console.log('▶️ INICIAR EXECUÇÃO:', id, data);

    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/iniciar`,
        data
      );
      console.log('✅ Execução iniciada com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao iniciar execução:', error);
      throw error;
    }
  }

  /**
   * Transição: EM_EXECUCAO → PAUSADA
   * Pausa temporariamente a execução da OS
   */
  async pausar(id: string, data: PausarExecucaoDto): Promise<{ message: string }> {
    console.log('⏸️ PAUSAR EXECUÇÃO:', id, data);

    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/pausar`,
        data
      );
      console.log('✅ Execução pausada com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao pausar execução:', error);
      throw error;
    }
  }

  /**
   * Transição: PAUSADA → EM_EXECUCAO
   * Retoma a execução de uma OS pausada
   */
  async retomar(id: string, data: RetomarExecucaoDto): Promise<{ message: string }> {
    console.log('▶️ RETOMAR EXECUÇÃO:', id, data);

    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/retomar`,
        data
      );
      console.log('✅ Execução retomada com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao retomar execução:', error);
      throw error;
    }
  }

  /**
   * Transição: EM_EXECUCAO/PAUSADA → FINALIZADA
   * Finaliza a execução da OS com resultados
   */
  async finalizar(id: string, data: FinalizarOSDto): Promise<{ message: string }> {
    console.log('🏁 FINALIZAR OS:', id, data);

    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/finalizar`,
        data
      );
      console.log('✅ OS finalizada com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao finalizar OS:', error);
      throw error;
    }
  }

  /**
   * Transição: QUALQUER (exceto FINALIZADA) → CANCELADA
   * Cancela a OS com motivo
   */
  async cancelar(id: string, data: CancelarOSDto): Promise<{ message: string }> {
    console.log('🚫 CANCELAR OS:', id, data);

    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/cancelar`,
        data
      );
      console.log('✅ OS cancelada com sucesso');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao cancelar OS:', error);
      throw error;
    }
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

export const execucaoOSTransitionsService = new ExecucaoOSTransitionsService();
