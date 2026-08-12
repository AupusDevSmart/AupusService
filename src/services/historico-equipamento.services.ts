// src/services/historico-equipamento.services.ts
import { api } from '@/config/api';

export interface TarefaDoHistorico {
  id: string;
  nome: string;
  status: string;
  data_conclusao: string | null;
  concluida_por: string | null;
}

export interface ItemHistoricoOS {
  tipo: 'OS' | 'PROGRAMACAO';
  id: string;
  numero: string;
  descricao: string;
  status: string;
  data: string | null;
  tarefas_total: number;
  tarefas_concluidas: number;
  tarefas: TarefaDoHistorico[];
}

/**
 * Ordens de serviço e programações que tocaram um equipamento.
 *
 * O endpoint vive no AupusService (módulo tarefas), não no api-shared: OS só
 * existe neste produto.
 */
export class HistoricoEquipamentoApiService {
  async listar(equipamentoId: string): Promise<ItemHistoricoOS[]> {
    const resposta = await api.get(`/equipamentos/${equipamentoId.trim()}/historico-os`);
    // O interceptor pode embrulhar em { success, data }.
    const dados = resposta.data?.data ?? resposta.data ?? [];
    return Array.isArray(dados) ? dados : [];
  }
}

export const historicoEquipamentoApi = new HistoricoEquipamentoApiService();
