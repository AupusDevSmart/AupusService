// src/services/execucao-os-transitions.service.ts
// Service for handling OS status transitions

import { api } from '@/config/api';

export type StatusExecucaoOS =
  | 'PENDENTE'
  | 'EM_EXECUCAO'
  | 'PAUSADA'
  | 'EXECUTADA'
  | 'AUDITADA'
  | 'FINALIZADA'
  | 'CANCELADA';

// ============================================================================
// DTOs para transições de status
// ============================================================================

export interface IniciarExecucaoDto {
  equipe_presente?: string[];
  responsavel_execucao?: string;
  observacoes?: string;
  data_hora_inicio_real?: string; // ISO DateTime
}

export interface PausarExecucaoDto {
  motivo_pausa: string;
  observacoes?: string;
}

export interface RetomarExecucaoDto {
  observacoes_retomada?: string;
}

export interface CancelarOSDto {
  motivo_cancelamento: string;
  observacoes?: string;
}

export interface ExecutarOSDto {
  data_hora_fim_real?: string; // ISO DateTime
  resultado_servico: string;
  problemas_encontrados?: string;
  recomendacoes?: string;
  observacoes_execucao?: string;
  materiais_consumidos?: { id: string; quantidade_consumida: number; observacoes?: string }[];
  ferramentas_utilizadas?: { id: string; condicao_depois: string; observacoes?: string }[];
  atividades_realizadas?: string;
  checklist_concluido?: number;
  procedimentos_seguidos?: string;
  equipamentos_seguranca?: string;
  incidentes_seguranca?: string;
  medidas_seguranca_adicionais?: string;
  custos_adicionais?: number;
  km_final?: number;
  observacoes_veiculo?: string;
}

export interface AuditarOSDto {
  avaliacao_qualidade?: number; // 1-5
  observacoes_qualidade?: string;
}

export interface ReabrirOSDto {
  observacoes?: string;
}

export interface FinalizarOSFinalDto {
  observacoes?: string;
}

// ============================================================================
// Service
// ============================================================================

export class ExecucaoOSTransitionsService {
  private readonly baseEndpoint = '/execucao-os';

  /**
   * Transição: PENDENTE -> EM_EXECUCAO
   * Inicia a execução da OS com equipe definida
   */
  async iniciar(id: string, data: IniciarExecucaoDto): Promise<{ message: string }> {
    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/iniciar`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Erro ao iniciar execucao:', error);
      throw error;
    }
  }

  /**
   * Transição: EM_EXECUCAO → PAUSADA
   * Pausa temporariamente a execução da OS
   */
  async pausar(id: string, data: PausarExecucaoDto): Promise<{ message: string }> {
    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/pausar`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Erro ao pausar execucao:', error);
      throw error;
    }
  }

  /**
   * Transição: PAUSADA → EM_EXECUCAO
   * Retoma a execução de uma OS pausada
   */
  async retomar(id: string, data: RetomarExecucaoDto): Promise<{ message: string }> {
    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/retomar`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Erro ao retomar execucao:', error);
      throw error;
    }
  }

  /**
   * Transição: EM_EXECUCAO/PAUSADA -> EXECUTADA
   * Registra resultados da execução
   */
  async executar(id: string, data: ExecutarOSDto): Promise<{ message: string }> {
    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/executar`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Erro ao executar OS:', error);
      throw error;
    }
  }

  /**
   * Transição: EXECUTADA -> AUDITADA
   * Registra auditoria de qualidade
   */
  async auditar(id: string, data: AuditarOSDto): Promise<{ message: string }> {
    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/auditar`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Erro ao auditar OS:', error);
      throw error;
    }
  }

  /**
   * Ação: AUDITADA -> EM_EXECUCAO
   * Reabre OS para nova execução (não é status, é ação)
   */
  async reabrir(id: string, data: ReabrirOSDto): Promise<{ message: string }> {
    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/reabrir`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Erro ao reabrir OS:', error);
      throw error;
    }
  }

  /**
   * Transição: AUDITADA -> FINALIZADA
   * Finaliza definitivamente a OS
   */
  async finalizar(id: string, data: FinalizarOSFinalDto): Promise<{ message: string }> {
    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/finalizar`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Erro ao finalizar OS:', error);
      throw error;
    }
  }

  /**
   * Transição: QUALQUER (exceto FINALIZADA/CANCELADA) -> CANCELADA
   * Cancela a OS com motivo
   */
  async cancelar(id: string, data: CancelarOSDto): Promise<{ message: string }> {
    try {
      const response = await api.patch<{ message: string }>(
        `${this.baseEndpoint}/${id}/cancelar`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('Erro ao cancelar OS:', error);
      throw error;
    }
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

export const execucaoOSTransitionsService = new ExecucaoOSTransitionsService();
